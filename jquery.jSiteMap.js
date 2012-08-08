/**
 * jQuery siteMap plugin.
 *
 * Author: Daisuke Murakami
 *
 * Based on the work of Wes Nolte
 * http://twitter.com/wesnolte 
 *
 * Copyright (c) 2012 Daisuke Murakami
 * Dual licensed under the MIT and GPL licenses.
 *
 */
(function($) {

$.fn.jSiteMap = function(options) {
	
	//オプションを設定(defaultをoptionsで上書き）
	var opts = $.extend({}, $.fn.jSiteMap.defaults, options);
	var $appendTo = $(opts.appendTo); //Map生成先
	
	//マップを作っていく
	if($(this).is("ul")) {
		buildNode($(this).find("li:first"), $appendTo, 0, opts); //再帰メソッド
	}else if($(this).is("li")) {
		buildNode($(this), $container, 0, opts);
	}
	setHeight();
	$(window).bind("resize",setHeight);
	
	/*
	//ドラッグ＆ドロップ機能
	if(opts.dragAndDrop){
		$('div.node').draggable({
			cursor      : 'move',
			distance    : 40,
			helper      : 'clone',
			opacity     : 0.8,
			revert      : 'invalid',
			revertDuration : 100,
			snap        : 'div.node.expanded',
			snapMode    : 'inner',
			stack       : 'div.node'
		});
		
		$('div.node').droppable({
			accept      : '.node',
			activeClass : 'drag-active',
			hoverClass  : 'drop-hover'
		});
		
		// Drag start event handler for nodes
		$('div.node').bind("dragstart", function handleDragStart( event, ui ){
			var sourceNode = $(this);
			sourceNode.parentsUntil('.node-container').find('*').filter('.node').droppable('disable');
		});
		
		// Drag stop event handler for nodes
		$('div.node').bind("dragstop", function handleDragStop( event, ui ){
			// reload the plugin
			$(opts.chartElement).children().remove();
			$(this).jSiteMap(opts);
		});
		
		// Drop event handler for nodes
		$('div.node').bind("drop", function handleDropEvent( event, ui ) {
			var targetID = $(this).data("tree-node");
			var targetLi = $(this).find("li").filter(function() { return $(this).data("tree-node") === targetID; } );
			var targetUl = targetLi.children('ul');
			var sourceID = ui.draggable.data("tree-node");    
			var sourceLi = $(this).find("li").filter(function() { return $(this).data("tree-node") === sourceID; } );   
			var sourceUl = sourceLi.parent('ul');
			if (targetUl.length > 0){
				targetUl.append(sourceLi);
			} else {
				targetLi.append("<ul></ul>");
				targetLi.children('ul').append(sourceLi);
			}
			//Removes any empty lists
			if (sourceUl.children().length === 0){
				sourceUl.remove();
			}
		}); // handleDropEvent
	} // Drag and drop
	*/
};



// Option defaults
$.fn.jSiteMap.defaults = {
		appendTo : 'body',
		dragAndDrop : false,
};

//ノードの数 これ、かぶらないように注意しないと
var nodeCount = 0;








//再起させてツリーを作る こいつがデカい
/**
 * $node : <li>タグ
 * $appendTo : ドコにつけるか？
 * level : 深さ？
 * opts : 設定(不変)
 */
function buildNode($node, $appendTo, level, opts) {
	
	//最終的に足されるtableとtbody
	var $table = $("<table cellpadding='0' cellspacing='0' border='0'/>");
	var $tbody = $("<tbody/>");
	
	//現在対象のliの子供のうち、最初のulの中のliがchildren
	var $childNodes = $node.children("ul:first").children("li");
	
	//行数:子供がいれば子供の数×2 いなければ1
	var rows = ($childNodes.length > 0)?$childNodes.length * 2:1;
	
	//自分ノードのtdを作成
	var $nodeCell = $("<td/>").addClass("node-cell").attr("rowspan",rows);
	
	//ノードを記述する
	//<li>タグのクローンを作り、その中の<ul><li>を全て削除し、戻ったhtmlを取得⇒現在のnodeの中身となる。
	var $nodeContent = $node.clone().children("ul,li").remove().end().html();
	
	//ノードにユニークIDをつけるべくインクリメント
	nodeCount++;
	
	//<li>タグのtree-nodeの値を付与
	$node.data("tree-node", nodeCount);
	
	//自分ノードの中身となるdivを作成
	var $nodeDiv = $("<div>").addClass("node").data("tree-node", nodeCount).append($nodeContent);
	$nodeCell.append($nodeDiv);
	
	//ノードの開閉を定義
	if ($childNodes.length > 0) {
		$nodeDiv.click(function() {
			var $this = $(this);
			var $td = $this.closest("td"); //divの親のうち最も近いtd
			var $tr = $this.closest("tr");
			if($td.hasClass('contracted')){
				$td.removeClass('contracted').addClass('expanded');
				$tr.removeClass('contracted').addClass('expanded');
				$td.nextAll().css("visibility","");
				$tr.nextAll().css("visibility","");
				// Update the <li> appropriately so that if the tree redraws collapsed/non-collapsed nodes
				// maintain their appearance
				$node.removeClass('collapsed');
			}else{
				$td.removeClass('expanded').addClass('contracted');
				$tr.removeClass('expanded').addClass('contracted');
				$td.nextAll().css("visibility","hidden");
				$tr.nextAll().css("visibility","hidden");
				$node.addClass('collapsed');
			}
		});
	}
	
	//子供がいたとき
	if($childNodes.length > 0) {
		$nodeDiv.css('cursor','col-resize'); //カーソル変えるだけ
		for(var i=0;i<rows;i++){
			var $row = $("<tr>");
			//線の部分の右側
			var $right = $("<td>&nbsp;</td>").addClass("line");
			if(i>0 && i<rows-1){ $right.addClass("left"); }
			if(i%2==0){
				$row.addClass("upper");
				$right.addClass("bottom");
				//各子供ノードの上側
				var $child = $("<td>").attr("rowspan","2");
				var childIndex = i/2;
				buildNode($($childNodes[childIndex]), $child, level+1, opts);//再帰
				if(i==0){
					var $left = $("<td>").addClass("line").attr("rowspan",rows);
					$left.append('<div class="bar">&nbsp;</div>');
					$row.append($nodeCell).append($left);
				}
				$row.append($right).append($child);
			}else{
				//各子供ノードの下側
				$right.addClass("top");
				$row.append($right);
			}
			$tbody.append($row);
		}
		
	}else{
		//子供がいないときは自分だけ加えて終了
		var $nodeRow = $("<tr/>").addClass("node-cells");
		$nodeRow.append($nodeCell);
		$tbody.append($nodeRow);
	}
	
	$("tr.upper").each(function(){
		var height1 = $(this).css("height").replace("px","");
		var height2 = $(this).next().css("height").replace("px","");
		var height = eval(height1+"+"+height2);
		alert("height1:"+height1+",height2:"+height2);
		$(this).css("height",height/2);
	});
	
	
	/*
	//collapsedがついているノードは最初から非表示にする
	//cloneを使って構成するので、非表示状態は非表示状態のままツリー移動できるようにする。
	// any classes on the LI element get copied to the relevant node in the tree
	// apart from the special 'collapsed' class, which collapses the sub-tree at this point
	if ($node.attr('class') != undefined) {
		var classList = $node.attr('class').split(/\s+/);
		$.each(classList, function(index,item) {
			if (item == 'collapsed') {
				console.log($node);
				$nodeRow.nextAll('tr').css('visibility', 'hidden');
				$nodeRow.removeClass('expanded');
				$nodeRow.addClass('contracted');
				$nodeDiv.css('cursor','s-resize');
			} else {
				$nodeDiv.addClass(item);
			}
		});
	}
	*/

	$table.append($tbody);
	$appendTo.append($("<span>").append($table));
	
	//ノード内のaタグによるイベント発火の場合、開閉イベントはキャンセルする
	$nodeDiv.children('a').click(function(e){
		console.log(e);
		e.stopPropagation();
	});
};

function setHeight(){
	$("tr.upper").each(function(){
		var height1 = $(this).css("height").replace("px","");
		var height2 = $(this).next().css("height").replace("px","");
		var height = eval(height1+"+"+height2);
		$(this).css("height",height/2);
	});
};



})(jQuery);
