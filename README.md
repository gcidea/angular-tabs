# angular-tabs
使用AngularJs封装Tabs选项卡组件
[特性分支-feature测试]

## 功能描述
　　该组件是管理系统中很常用的功能，平台使用者可能会同时使用不同模块的功能，这时候需要打开多个模块，Tabs组件是一种类似浏览器多标签页的效果。可以：
* 可以在多个模块的页面间进行切换
* 在某个页面上右键关闭
* 附带收起侧边栏功能
* ...

***
##  概述
　　承载该表格插件的主要模板html结构如下
``` javascript
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
```

***
## 主要逻辑解释
### 数据绑定
``` javascript
bindings:{
        showLength:'@',
        maxLength:'@',
        container:'@',
        initTab:'='
    },
```
