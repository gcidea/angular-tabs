1123 (function ( angular ) {
'use strict';

angular.module('moduleTabs',['messageDialog'], function($compileProvider) {
    $compileProvider.directive('tabContent', function($compile,$controller) {
        return function(scope, element, attrs) {
            scope.$watch(
                function(scope) {
                    return scope.$eval(attrs.tabContent);
                },function(pane) {
                    var locals = {};
                    angular.extend(scope,pane.data);
                    if (pane.controller) {
                        $controller(pane.controller, angular.extend(locals,{
                            $scope: scope
                        }));
                    }
                    element.html(pane.template);
                    $compile(element.contents())(scope);
                }
            );
        };
    });
}).factory('moduleTabsService',function(){
	return {
		actIndex : null,
		actTab : null,
	};
}).component('moduleTabs',{
    transclude: true,
    bindings:{
        showLength:'@',
        maxLength:'@',
        container:'@',
        initTab:'='
    },
    controller: function($scope,$document,$compile,$animate,moduleTabsService,Box) {
        var ctrl = this;
        var tabLength = 158;
        
        ctrl.$onInit = function() {
        	ctrl.componentId = "angular-tabs-"+getRandomId();
            ctrl.panes = [];
            ctrl.moreTab = false;
            ctrl.moreTabContent = false;
            if (!ctrl.showLength) {
            	ctrl.showLength = getShowLength();
            } else {
            	ctrl.uShowLength = ctrl.showLength;
            }

            angular.forEach(ctrl.initTab,function(value,key){
                ctrl.openPane(newPane(value));
            });

            $document.bind('click',function(event){
                var isButton = angular.element(event.target).hasClass('more-tab-btn');
                var rightMenu = angular.element(event.target).hasClass('tab-menu');
                $scope.$apply(function(){
                    if (!isButton) {
                        ctrl.moreTabContent = false;
                    }
                    if(!rightMenu) {
                    	ctrl.rightMenu = false;
                    }
                });
            });
            $document.bind('mousemove',function($event){
            	if(ctrl.drag) {
            		$scope.$apply(function(){
            			dragPane($event);
            		});
            	}
            });
            $document.bind('mouseup',function($event){
            	if(ctrl.drag) {
            		$scope.$apply(function(){
                		ctrl.drag = false;
                		var offsetX = parseInt(angular.element("#" + ctrl.componentId).offset().left);
                		var index = parseInt(($event.clientX-offsetX-40)/tabLength);
                		if(index >= ctrl.panes.length) {
                			index = ctrl.panes.length - 1;
                		} else if(index >= ctrl.showLength) {
                			index = ctrl.showLength - 1;
                		} else if(index < 0) {
                			index = 0;
                		}
                		var oldIndex = findPane(ctrl.downPane.pane);
                		var replacePane = ctrl.panes.splice(index,1,ctrl.downPane.pane);
                		ctrl.panes.splice(oldIndex,1,replacePane[0]);
                		ctrl.downPane.pane.paneStyle = {
                			"z-index":undefined,
                			"left":undefined
                		};
                		ctrl.downPane = null;
                	});
            	}
            });
            
            angular.element(window).resize(function(){
                $scope.$apply(function(){
                	ctrl.moreTabContent = false;
                	ctrl.rightMenu = false;
                	ctrl.showLength = getShowLength();
                	if(ctrl.showLength > ctrl.uShowLength) {
                		ctrl.showLength = ctrl.uShowLength; 
                	}
                });
            });
            $scope.$on('tabRefresh',function(event){
            	ctrl.showLength = getShowLength();
            	if(ctrl.showLength > ctrl.uShowLength) {
            		ctrl.showLength = ctrl.uShowLength; 
            	}
            });
        }

        $scope.$watchCollection(function(){
            return ctrl.panes;
        },function(newValue,oldValue){
        	if(ctrl.panes.length > ctrl.showLength) {
        		ctrl.moreTab = true;
        	} else {
        		ctrl.moreTab = false;
        	}
        	ctrl.moreTabContent = false;
            ctrl.showPanes = ctrl.panes.slice(0,ctrl.showLength);
            ctrl.morePanes = ctrl.panes.slice(ctrl.showLength,ctrl.panes.length);
        });
        
        $scope.$watch(function(){
            return ctrl.showLength;
        },function(newValue){
        	if(ctrl.panes.length > ctrl.showLength) {
        		ctrl.moreTab = true;
        	} else {
        		ctrl.moreTab = false;
        	}
            ctrl.showPanes = ctrl.panes.slice(0,newValue);
            ctrl.morePanes = ctrl.panes.slice(newValue,ctrl.panes.length);
            var selectedIndex = null;
        	angular.forEach(ctrl.panes,function(value,index){
        		if(value.selected) {
        			selectedIndex = index;
        			return;
        		}
        	});
            select(selectedIndex);
        });

        ctrl.show = function(pane) {
        	var idx = findPane(pane,true);
        	select(idx);
        };
        ctrl.openPane = function(pane) {
            var index = findPane(pane,true);
            if(angular.isNumber(index)) {
            	if(index == -1) {
            		if (ctrl.panes.length >= ctrl.maxLength) {
            			Box.error("已达到标签页数上限，请先关闭其他标签!");
            			select(moduleTabsService.actIndex);
                        return ;
                    }
                    pane.id = "tab-pane-" + getRandomId();
                    ctrl.panes.push(pane);
                    index = ctrl.panes.length - 1;
                    if (ctrl.panes.length > ctrl.showLength) {
                        ctrl.moreTab = true;
                    }
                } else {
                	ctrl.panes[index].data = pane.data;
                    ctrl.panes[index].template = buildTemplate(ctrl.panes[index].name,ctrl.panes[index].data);
                	if(ctrl.panes[index].reBuild) {
                		var element = angular.element(document.getElementById(ctrl.panes[index].id));
                        angular.extend($scope,ctrl.panes[index].data);
                        if (ctrl.panes[index].controller) {
                            $controller(ctrl.panes[index].controller, angular.extend({},{
                                $scope: $scope
                            }));
                        }
                        element.html(ctrl.panes[index].template);
                        $compile(element.contents())($scope);
                	}
                }
            }
            select(index);
        };
        ctrl.close = function(pane) {
            deleteTab(pane);
            if (ctrl.panes.length <= ctrl.showLength) {
                ctrl.moreTab = false;
            }
        };
        ctrl.openMoreTab = function() {
            ctrl.moreTabContent = !ctrl.moreTabContent;
            var btnEle = angular.element("#" + ctrl.componentId + " .more-tab-btn");
            var cLeft = btnEle.offset().left;
            var cTop = btnEle.offset().top;
            var btnHeight = btnEle.outerHeight();
            var btnWidth = btnEle.outerWidth();
            var selfWidth = angular.element("#" + ctrl.componentId + " .more-tabContent").outerWidth();
            ctrl.mTCStyle = {
            	"position":"fixed",
            	"z-index":"1000",
            	"left":cLeft - (selfWidth - btnWidth),
            	"top":cTop + btnHeight
            };
        };
        
        ctrl.rightPane = null;
        ctrl.downPane = null;
        ctrl.paneClick = function($event,pane,index) {
        	ctrl.moreTabContent = false;
        	ctrl.rightMenu = false;
        	if($event.button == 2) {
        		ctrl.rightPane = pane;
        		ctrl.menuStyle = {
        			'position':'fixed',
        			'z-index':'1000',
        			'top':$event.clientY,
        			'left':$event.clientX
        		}
        		ctrl.rightMenu = true;
        	} else if($event.button == 0) {
        		ctrl.show(pane);
        		ctrl.downPane = {
        			index:index,
        			pane:pane,
        			top:$event.clientY,
        			left:$event.clientX
        		};
        		ctrl.drag = true;
        	}
        };
        ctrl.closeAll = function() {
        	ctrl.panes = [];
        };
        ctrl.closeOther = function() {
        	ctrl.panes = [];
        	ctrl.panes.push(ctrl.rightPane);
        	ctrl.show(ctrl.rightPane);
        	ctrl.rightPane = null;
        };

        /*
         *  新增接口方法用以打开tab页
         */
        $scope.$on("openTab",function(event,msg){
            ctrl.openPane(newPane(msg));
        });
        
        function getShowLength() {
        	var iWidth = angular.element(ctrl.container || window).width();
        	return parseInt((iWidth-14-20-40)/tabLength);
        };
        function deleteTab(pane) {
        	var idx = findPane(pane);
        	var deletePane = ctrl.panes.splice(idx,1)[0];
        	if(deletePane.selected && ctrl.panes[idx]) {
        		select(idx);
            } else if(deletePane.selected && ctrl.panes[idx-1]) {
            	select(idx-1);
            }
            angular.element(document.getElementById(pane.id)).remove();
        };
        function getRandomId() {
            var timestamp = new Date().getTime();
            var rand = Math.floor(Math.random()*Math.pow(10,String(timestamp).length)+1);
            return timestamp + rand;
        };
        function buildTemplate(name,data) {
            var template = "<"+name+" xmlns='custom' ";
            if (data) {
                angular.forEach(data,function(value,key){
                    if (angular.isString(value) || angular.isNumber(value)) {
                        template += ' '+key+'="'+value+'"';
                    } else if(angular.isObject(value)) {
                        template += ' '+key+'="'+key+'"';
                    }
                });
            }
            template += "/>";
            return template;
        };
        function findPane(pane,reset) {
        	var index = -1;
        	angular.forEach(ctrl.panes,function(value,idx){
        		if(reset) {
    				value.selected = false;
    			}
        		if(value.name == pane.name && value.pId == pane.pId) {
        			index = idx;
        			return;
        		}
        	});
        	return index;
        };
        function select(index) {
        	if(angular.isNumber(index) && index != -1) {
                ctrl.panes[index].selected = true;
                moduleTabsService.actTab = ctrl.panes[index];
                moduleTabsService.actIndex = index;
                if (index >= ctrl.showLength) {
                    var selectedPane = ctrl.panes.splice(index,1);
                    var replacePane = ctrl.panes.splice(ctrl.showLength-1,1,selectedPane[0]);
                    ctrl.panes.push(replacePane[0]);
                    moduleTabsService.actIndex = ctrl.showLength-1;
                }
        	}
        };
        function dragPane($event) {
    		var newDownPosition = {
    			top:$event.clientY,
    			left:$event.clientX
    		};
    		var offsetX = newDownPosition.left - ctrl.downPane.left;
    		ctrl.downPane.pane.paneStyle = {
    			'z-index':1000,
    			'left':offsetX
    		}
        };
        function newPane(msg) {
            var name = null;
            var template = null;
            var controller = null;

            if (angular.isString(msg)) {
                name = msg;
                template = buildTemplate(msg);
            } else if (angular.isObject(msg)) {
                name = msg.name;
                controller = msg.controller;
                template = msg.template;
                if (!msg.template) {
                    template = buildTemplate(msg.name,msg.data);
                }
            }

            /*
             *  tab对象属性构成
             */
            var pane = {
                id:null,
                pId:msg.id||0,
                name:name,
                title:msg.title||name,
                template:template,
                selected:false,
                controller:controller,
                data:msg.data,
                reBuild:false||msg.reBuild
            };

            return pane;
        };
    },
    template:   '<div id="{{$ctrl.componentId}}" class="module-tabs">'+
    				'<div class="tab-label">'+
	                    '<ul class="main-tabs">'+
	                    	'<li class="glyphicons">'+
								'<span class="glyphicon glyphicon-home">'+
								'</span>'+
							'</li>'+
	                        '<li ng-repeat="pane in $ctrl.showPanes" ng-class="{active:pane.selected}" '+ 
	                    		'ng-mousedown="$ctrl.paneClick($event,pane,$index)"'+
	                    		'oncontextmenu="javascript:return false;" onmousemove="javascript:return false;" ng-style="pane.paneStyle">'+
	                            '<label ng-bind="pane.title" title="{{pane.title}}"></label>'+
	                            '<button ng-click="$ctrl.close(pane)"></button>'+
	                        '</li>'+
	                    '</ul>'+
	                    '<div ng-if="$ctrl.rightMenu" class="tab-menu" oncontextmenu="javascript:return false;">'+
		                	'<ul class="dropdown-menu" ng-style="$ctrl.menuStyle">'+
		                		'<li ng-click="$ctrl.closeAll()">关闭全部</li>'+
		                		'<li ng-click="$ctrl.closeOther()">关闭其他标签页</li>'+
		                	'</ul>'+
		                '</div>'+
	                    '<div ng-if="$ctrl.moreTab" class="more-tab">'+
	                        '<button ng-click="$ctrl.openMoreTab()" class="more-tab-btn"></button>'+
	                    '</div>'+
                    '</div>'+
                    '<div ng-show="$ctrl.moreTabContent" class="more-tabContent" ng-style="$ctrl.mTCStyle">'+
	                    '<div ng-repeat="pane in $ctrl.morePanes" class="more-panes" ng-click="$ctrl.show(pane)">'+
	                        '<label ng-bind="pane.title" title="{{pane.title}}"></label>'+
	                        '<button ng-click="$ctrl.close(pane)"></button>'+
	                    '</div>'+
	                '</div>'+
                    '<div class="tab-content">'+
                        '<div id="{{pane.id}}" ng-show="pane.selected" ng-repeat="pane in $ctrl.panes">'+
                            '<pane pane-content="pane" is-active="pane.selected" xmlns="custom"/>'+
                        '</div>'+
                    '</div>'+
                '</div>'
}).component('pane',{
    transclude: true,
    bindings:{
        paneContent:'=',
        active:'<isActive'
    },
    template:'<div tab-content="$ctrl.paneContent"/>',
    controller:function($scope){
    	var ctrl = this;
    	ctrl.$onChanges = function(obj) {
    		if(obj.active && ctrl.active) {
    			if(ctrl.active) {
    				$scope.$broadcast("tabOnActive");
    			}
    		}
    	};
    }
});

})( angular );
