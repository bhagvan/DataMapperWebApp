/**
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

DataMapper.Views.ConnectorView = Backbone.View.extend({
    parent: d3.select("#canvas"),
    el: "#canvas",
    initialize: function (options) {
        this.parent = options.parent;
    },
    render: function () {
        var line = this.parent.append("line").attr("class", "drag-line")
            .style("stroke", "black")
            .style("stroke-width", "2")
            .attr("id", "line-" + this.cid);
        this.el = "#" + line.attr("id");
        this.model.set('line', line);
        return line;
    },
    dropFunction: function () {
        var model = this.model;
        Diagram.Connectors.add(model);
        var overlay = model.addPolyline();
        //if the line is direct
        if (model.isDirectConnector()) {
            model.addDirectOperator();
        } else {
            //            console.log(model.get('targetNode').get('isSchema'));
            if (!model.get('targetNode').get('isSchema')) {
                model.get('targetNode').get('node').select('text').text(model.get('sourceNode').get('text'));
            }
        }
        this.bindMenu("#connector-menu");
    },
    bindMenu: function (menu) {
        var self = this;
        var classClicked = self.el + "-clicked";
        $("#" + this.model.get('lineOverlay').attr("id")).on("contextmenu", function (event) {
            // Avoid the real one
            event.preventDefault();

            // Show contextmenu
            $(menu).finish().toggle(100)
                .css({ // In the right position (the mouse)
                    top: event.pageY + "px",
                    left: event.pageX + "px"
                })
                .addClass(classClicked);

            self.model.get('lineOverlay').classed("clicked", true);
        });
        // If the document is clicked somewhere
        $(document).on("mousedown", function (e) {

            // If the clicked element is not the menu
            if (!$(e.target).parents(menu).length > 0) {
                //                console.log("rem");
                self.model.get('lineOverlay').classed("clicked", false).style("opacity", "0");
                // Hide it
                $(menu).removeClass(classClicked);
                $(menu).hide(100);
            }
        });


        // If the menu element is clicked
        $(menu + " li").on("click", function () {
            // This is the triggered action name
            if ($(menu).hasClass(classClicked)) {
                switch ($(this).attr("data-action")) {
                case "clear-connector":
                    self.model.removeConnector();
                    break;
                }
            }

            // Hide it AFTER the action was triggered
            $(menu).hide(100);
        });
    }
});


DataMapper.Models.Connector = Backbone.Model.extend({
    sourceContainer: d3.select("#canvas"), //container
    sourceNode: null, //node (g)
    sourcePath: null,
    targetContainer: d3.select("#canvas"),
    targetNode: null,
    targetPath: null,
    line: null,
    status: 1,
    val: 5,
    initialize: function () {
        // this.on("change:x2", function (model) {
        //     model.setPoints();
        // });
    },
    addDirectOperator: function () {
        //                    var self = this;
        var operator = new DataMapper.Models.Operator({
            title: "directOperator",
            inputLabels: ["Direct"],
            outputLabels: ["Direct"]
        });
        var head = this.get('sourceNode').clone();
        var tail = this.get('targetNode').clone();
        operator.get('nodeCollection').add([head, tail]);
        this.operator = operator;
        Diagram.Operators.add(operator);
    },
    removeConnector: function () {
        if (this.isDirectConnector()) {
            Diagram.Operators.remove(this.operator);
        } else {
            var tnode = this.get('targetNode');
            if (!tnode.get('isSchema')) {
                tnode.updateText();
            }
        }
        this.get('line').remove();
        this.get('lineOverlay').remove();
        Diagram.Connectors.remove(this);
    },
    isDirectConnector: function () {
        return this.get('sourceContainer').get('parent').classed("tree-dmcontainer") && this.get('targetContainer').get('parent').classed("tree-dmcontainer");
    },
    addPolyline: function () {
        var parent = this.get('sourceNode').get('node'),
            line = this.get('line');

        var polyLine = parent.append("polyline").attr("class", "drag-line")
            .style("stroke", "black")
            .style("fill", "none")
            .style("stroke-width", "2")
            .attr("id", line.attr("id"));
        var overlay = parent.append("polyline").attr("class", "drag-line drag-line-overlay")
            .style("stroke", "#3399ff")
            .style("stroke-width", "15")
            .style("fill", "none")
            .style("opacity", "0")
            .attr("id", line.attr("id") + "-overlay");

        var mouseOver = function () {
            return overlay.style("opacity", "0.2");
        };
        var mouseLeave = function () {
            return overlay.classed("clicked") ? overlay.style("opacity", "0.2") : overlay.style("opacity", "0");
        };

        overlay.on("mouseover ", mouseOver)
            .on("mouseleave", mouseLeave);
        // .on("contextmenu", overlay.classed("clicked", true));


        // var event = document.createEvent('Event');
        // event.initEvent('mouseover', true, true);
        // event.initEvent('mouseleave', true, true);
        // overlay.node().dispatchEvent(event);

        this.set("lineOverlay", overlay);
        this.set('line', polyLine);
        this.set("x1", line.attr("x1"));
        this.set("x2", line.attr("x2"));
        this.set("y1", line.attr("y1"));
        this.set("y2", line.attr("y2"));

        line.remove();
        this.setPoints(this.get('x1'), this.get('x2'), this.get('y1'), this.get('y2'));
        return overlay;
    },
    setPoints: function (x1, x2, y1, y2) {
        var margin = 20;
        var points = "";
        this.get('line').attr("points", function () {
            var p1 = x1 + "," + y1,
                p2 = (Number(x1) + margin) + "," + y1,
                p3 = (Number(x2) - margin) + "," + y2,
                p4 = x2 + "," + y2;
            points = p1 + " " + p2 + " " + p3 + " " + p4;
            return points;
        });
        this.get('lineOverlay').attr("points", points);
    }
});

DataMapper.Collections.Connectors = Backbone.Collection.extend({
    model: DataMapper.Models.Connector,
    url: "/connectors",
    findFromTargetNode: function (targetNode) { //know the target
        return this.find(function (item) { //assuming target can have only one source
            if (item.get("targetNode").get('node').node().isSameNode(targetNode.node()))
                return item;
        });
    },
    findFromSourceNode: function (sourceNode) { //know the source
        var array = this.filter(function (d) { //assuming a source can have multiple targets
            if (d.get('sourceNode').get('node').node().isSameNode(sourceNode.node())) {
                return d;
            }
        });
        return array;
    },
    findFromTargetContainer: function (targetContainer) {
        var array = this.filter(function (d) {
            if (d.get('targetContainer').get('parent').node().isSameNode(targetContainer.node())) {
                return d;
            }
        });
        return array;
    },
    findFromSourceContainer: function (sourceContainer) {
        var array = this.filter(function (d) {
            if (d.get('sourceContainer').get('parent').node().isSameNode(sourceContainer.node())) {
                return d;
            }
        });
        return array;
    },
    clearConnectionsFromContainer: function (container) {
        var collection = this;
        this.findFromSourceContainer(container).map(function (item) {
            item.removeConnector();
        });
        this.findFromTargetContainer(container).map(function (item) {
            item.removeConnector();
        });
    }
});