// It does not try to register in a CommonJS environment since jQuery is not
// likely to run in those environments.
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery', 'gridlist'], factory);
  } else {
    factory(jQuery, GridList);
  }
}(function($, GridList) {

  var DraggableGridList = function(element, options, draggableOptions, resizableOptions) {
    this.options = $.extend({}, this.defaults, options);
    this.draggableOptions = $.extend( {}, this.draggableDefaults, draggableOptions);
    this.resizableOptions = $.extend( {}, this.resizableDefauls, resizableOptions );

    this.$element = $(element);
    this._init();
    this._bindEvents();
  };

  DraggableGridList.prototype = {

    defaults: {
      rows: 5,
      itemSelector: 'li[data-w]',
      widthHeightRatio: 1,
      dragAndDrop: true,
      cellMargins : [ 10 , 10 ],
      vertical : false
    },

    draggableDefaults: {
      zIndex: 2,
      scroll: false,
      containment: "parent"
    },

    resizableDefauls: {
      handles: "se",
      containment: "parent"
    },

    destroy: function() {
      this._unbindEvents();
    },

    resize: function(rows) {
      if (rows) {
        this.options.rows = rows;
      }
      this._createGridSnapshot();
      this.gridList.resizeGrid(this.options.rows);
      this._updateGridSnapshot();

      this.reflow();
    },

    resizeItem: function(element, size) {
      /**
       * Resize an item.
       *
       * @param {Object} size
       * @param {Number} [size.w]
       * @param {Number} [size.h}
       */

      this._createGridSnapshot();
      this.gridList.resizeItem(this._getItemByElement(element), size);
      this._updateGridSnapshot();

      this.render();
    },

    reflow: function() {
      this._calculateCellSize();
      this.render();
    },

    render: function() {
      this._applySizeToItems();
      this._applyPositionToItems();
    },

    add: function( element , w , h ) {
      this._updateElementData();

      var item;
      if( this.options.vertical )
      {
        item = { x : 0 , y : 0 , w : h , h : w };
      }
      else
      {
        item = { x : 0 , y : 0 , w : w , h : h };
      }

      var nextPos = this.gridList.findPositionForItem( item , { x : 0 , y : 0 } );

      if( this.options.vertical )
      {
        var temp = nextPos[1];
        nextPos[1] = nextPos[0];
        nextPos[0] = temp;
      }

      element.attr( {
        "data-x" : nextPos[0],
        "data-y" : nextPos[1],
        "data-w" : w,
        "data-h" : h
      } );

      this.$element.append( element );
      this._unbindEvents();
      this._init();
      this._bindEvents();

      return {
        x : nextPos[0],
        y : nextPos[1]
      };
    },

    remove: function( element ) {
      this._updateElementData();

      element.remove();

      this._unbindEvents();
      this._init();
      this._bindEvents();
      this.resize();
    },

    debug: function() {
      console.log( this.gridList.toString() );
    },

    _updateElementData: function() {
      for( var i = 0; i < this.items.length; i++ )
      {
        if( this.options.vertical )
        {
          this.items[i].$element.attr( {
            "data-x" : this.items[i].y,
            "data-y" : this.items[i].x,
            "data-w" : this.items[i].h,
            "data-h" : this.items[i].w
          } );
        }
        else
        {
          this.items[i].$element.attr( {
            "data-x" : this.items[i].x,
            "data-y" : this.items[i].y,
            "data-w" : this.items[i].w,
            "data-h" : this.items[i].h
          } );
        }
      }
    },

    _bindMethod: function(fn) {
      /**
       * Bind prototype method to instance scope (similar to CoffeeScript's fat
       * arrow)
       */
      var that = this;
      return function() {
        return fn.apply(that, arguments);
      };
    },

    _init: function() {
      // Read items and their meta data. Ignore other list elements (like the
      // position highlight)
      this.$items = this.$element.children(this.options.itemSelector);
      this.$items.resizable(this.resizableOptions);

      this.items = this._generateItemsFromDOM();
      this._widestItem = Math.max.apply(
        null, this.items.map(function(item) { return item.w; }));

      // Used to highlight a position an element will land on upon drop
      this.$positionHighlight = this.$element.find('.position-highlight').hide();

      this._initGridList();
      this.reflow();

      if (this.options.dragAndDrop) {
        // Init Draggable JQuery UI plugin for each of the list items
        // http://api.jqueryui.com/draggable/
        this.$items.draggable(this.draggableOptions);
      }
    },

    _initGridList: function() {
      // Create instance of GridList (decoupled lib for handling the grid
      // positioning and sorting post-drag and dropping)
      this.gridList = new GridList(this.items, {
        rows: this.options.rows,
        vertical: this.options.vertical
      } );
    },

    _bindEvents: function() {
      this._onStart = this._bindMethod(this._onStart);
      this._onDrag = this._bindMethod(this._onDrag);
      this._onStop = this._bindMethod(this._onStop);
      this._onResize = this._bindMethod(this._onResize);
      this._onResizeStop = this._bindMethod(this._onResizeStop);
      this.$items.on('dragstart', this._onStart);
      this.$items.on('drag', this._onDrag);
      this.$items.on('dragstop', this._onStop);
      this.$items.on('resizestart', this._onStart);
      this.$items.on('resize', this._onResize);
      this.$items.on('resizestop', this._onResizeStop);
    },

    _unbindEvents: function() {
      this.$items.off('dragstart', this._onStart);
      this.$items.off('drag', this._onDrag);
      this.$items.off('dragstop', this._onStop);
      this.$items.off('resizestart', this._onStart);
      this.$items.off('resize', this._onResize);
      this.$items.off('resizestop', this._onResizeStop);
    },

    _onStart: function(event, ui) {
      // Create a deep copy of the items; we use them to revert the item
      // positions after each drag change, making an entire drag operation less
      // distructable
      this._createGridSnapshot();

      // Since dragging actually alters the grid, we need to establish the number
      // of cols (+1 extra) before the drag starts
      this._maxGridCols = this.gridList.grid.length;
    },

    _onDrag: function(event, ui) {
      var item = this._getItemByElement(ui.helper),
          newPosition = this._snapItemPositionToGrid(item);

      if (this._dragPositionChanged(newPosition)) {
        this._previousDragPosition = newPosition;

        // Regenerate the grid with the positions from when the drag started
        GridList.cloneItems(this._items, this.items);
        this.gridList.generateGrid();

        // Since the items list is a deep copy, we need to fetch the item
        // corresponding to this drag action again
        item = this._getItemByElement(ui.helper);
        this.gridList.moveItemToPosition(item, newPosition);

        // Visually update item positions and highlight shape
        this._applyPositionToItems();
        this._highlightPositionForItem(item);
      }
    },

    _onStop: function(event, ui) {
      this._updateGridSnapshot();
      this._previousDragPosition = null;

      // HACK: jQuery.draggable removes this class after the dragstop callback,
      // and we need it removed before the drop, to re-enable CSS transitions
      $(ui.helper).removeClass('ui-draggable-dragging');

      this._applyPositionToItems();
      this._removePositionHighlight();
    },

    _onResize: function( event, ui ) {
      if( !ui ) return;

      var item = this._getItemByElement( ui.helper ),
          newSize = this._snapItemSizeToGrid( item );

      if( !this.previousSize ||
          this.previousSize.w !== newSize.w || this.previousSize.h !== newSize.h )
      {
        this.previousSize = newSize;

        // Regenerate the grid with the positions from when the drag started
        GridList.cloneItems(this._items, this.items);
        this.gridList.generateGrid();

        // Since the items list is a deep copy, we need to fetch the item
        // corresponding to this drag action again
        item = this._getItemByElement(ui.helper);
        this.gridList.resizeItem( item , newSize );

        // Visually update item positions and highlight shape
        this._applyPositionToItems();
        this._highlightPositionForItem(item);
      }
    },

    _onResizeStop: function( event, ui ) {
      this._updateGridSnapshot();
      this.previousSize = null;

      $(ui.helper).removeClass('ui-resizable-resizing');

      this._applySizeToItems();
      this._removePositionHighlight();
    },

    _generateItemsFromDOM: function() {
      /**
       * Generate the structure of items used by the GridList lib, using the DOM
       * data of the children of the targeted element. The items will have an
       * additional reference to the initial DOM element attached, in order to
       * trace back to it and re-render it once its properties are changed by the
       * GridList lib
       */
      var _this = this,
          items = [],
          item;
      this.$items.each(function(i, element) {
        if( _this.options.vertical )
        {
          items.push({
            $element: $(element),
            x: Number($(element).attr('data-y')),
            y: Number($(element).attr('data-x')),
            w: Number($(element).attr('data-h')),
            h: Number($(element).attr('data-w')),
            id: Number($(element).attr('data-id'))
          });
        }
        else
        {
          items.push({
            $element: $(element),
            x: Number($(element).attr('data-x')),
            y: Number($(element).attr('data-y')),
            w: Number($(element).attr('data-w')),
            h: Number($(element).attr('data-h')),
            id: Number($(element).attr('data-id'))
          });
        }
      });
      return items;
    },

    _getItemByElement: function(element) {
      // XXX: this could be optimized by storing the item reference inside the
      // meta data of the DOM element
      for (var i = 0; i < this.items.length; i++) {
        if (this.items[i].$element.is(element)) {
          return this.items[i];
        }
      }
    },

    _calculateCellSize: function() {
      if( this.options.vertical )
      {
        this._cellWidth = Math.floor( this.$element.width() / this.options.rows );
        this._cellHeight = this._cellWidth * this.options.widthHeightRatio;
      }
      else
      {
        this._cellHeight = Math.floor(this.$element.height() / this.options.rows);
        this._cellWidth = this._cellHeight * this.options.widthHeightRatio;
      }
      if (this.options.heightToFontSizeRatio) {
        this._fontSize = this._cellHeight * this.options.heightToFontSizeRatio;
      }

      // Set resize limits based on new cell size
      this.$items.resizable( "option" , {
        minWidth: this._cellWidth * 0.8,
        minHeight: this._cellHeight * 0.8
      } );
    },

    _getItemWidth: function(item) {
      if( this.options.vertical )
      {
        return item.h * this._cellWidth - this.options.cellMargins[0];
      }
      else
      {
        return item.w * this._cellWidth - this.options.cellMargins[0];
      }
    },

    _getItemHeight: function(item) {
      if( this.options.vertical )
      {
        return item.w * this._cellHeight - this.options.cellMargins[1];
      }
      else
      {
        return item.h * this._cellHeight - this.options.cellMargins[1];
      }
    },

    _applySizeToItems: function() {
      for (var i = 0; i < this.items.length; i++) {
        this.items[i].$element.css({
          width: this._getItemWidth(this.items[i]),
          height: this._getItemHeight(this.items[i])
        });

        this.items[i].$element.trigger( "resize" );
      }
      if (this.options.heightToFontSizeRatio) {
        this.$items.css('font-size', this._fontSize);
      }
    },

    _applyPositionToItems: function() {
      // TODO: Implement group separators
      for (var i = 0; i < this.items.length; i++) {
        // Don't interfere with the positions of the dragged items
        if (this.items[i].move) {
          continue;
        }
        if( this.options.vertical )
        {
          this.items[i].$element.css({
            left: this.items[i].y * this._cellWidth,
            top: this.items[i].x * this._cellHeight
          });
        }
        else
        {
          this.items[i].$element.css({
            left: this.items[i].x * this._cellWidth,
            top: this.items[i].y * this._cellHeight
          });
        }
      }
      // Update the width of the entire grid container with enough room on the
      // right to allow dragging items to the end of the grid.
      if( this.options.vertical )
      {
        this.$element.height(
          (this.gridList.grid.length + this._widestItem) * this._cellHeight);
      }
      else
      {
        this.$element.width(
          (this.gridList.grid.length + this._widestItem) * this._cellWidth);
      }
    },

    _dragPositionChanged: function(newPosition) {
      if (!this._previousDragPosition) {
        return true;
      }
      return (newPosition[0] != this._previousDragPosition[0] ||
              newPosition[1] != this._previousDragPosition[1]);
    },

    _snapItemPositionToGrid: function(item) {
      var position = item.$element.position(),
          row,
          col;
      position.left -= this.$element.position().left;

      if( this.options.vertical )
      {
        row = Math.round(position.left / this._cellWidth);
        col = Math.round(position.top / this._cellHeight);
      }
      else
      {
        col = Math.round(position.left / this._cellWidth);
        row = Math.round(position.top / this._cellHeight);
      }
      // Keep item position within the grid and don't let the item create more
      // than one extra column
      col = Math.max(col, 0);
      row = Math.max(row, 0);
      col = Math.min(col, this._maxGridCols);
      row = Math.min(row, this.options.rows - item.h);
      return [col, row];
    },

    _snapItemSizeToGrid: function( item ) {
      var width = item.$element.width();
      var height = item.$element.height();

      var newWidth = Math.ceil( width / this._cellWidth );
      var newHeight = Math.ceil( height / this._cellHeight );

      if( this.options.vertical )
      {
        var temp = newHeight;
        newHeight = newWidth;
        newWidth = temp;
      }

      newHeight = Math.min( newHeight , this.options.rows - item.y );

      return {
        w: newWidth,
        h: newHeight
      };
    },

    _highlightPositionForItem: function(item) {
      this.$positionHighlight.css( {
        width: this._getItemWidth(item),
        height: this._getItemHeight(item),

      } );

      if( this.options.vertical )
      {
        this.$positionHighlight.css( {
          left: item.y * this._cellWidth,
          top: item.x * this._cellHeight
        } );
      }
      else
      {
        this.$positionHighlight.css( {
          left: item.x * this._cellWidth,
          top: item.y * this._cellHeight
        } );
      }

      this.$positionHighlight.show();
      if (this.options.heightToFontSizeRatio) {
        this.$positionHighlight.css('font-size', this._fontSize);
      }
    },

    _removePositionHighlight: function() {
      this.$positionHighlight.hide();
    },

    _createGridSnapshot: function() {
      this._items = GridList.cloneItems(this.items);
    },

    _updateGridSnapshot: function() {
      // Notify the user with the items that changed since the previous snapshot
      this._triggerOnChange();
      GridList.cloneItems(this.items, this._items);
    },

    _triggerOnChange: function() {
      if (typeof(this.options.onChange) != 'function') {
        return;
      }
      this.options.onChange.call(
        this, this.gridList.getChangedItems(this._items, '$element'));
    }
  };

  $.fn.gridList = function(options, draggableOptions) {
    if (!window.GridList) {
      throw new Error('GridList lib required');
    }
    var instance,
        method,
        args;
    if (typeof(options) == 'string') {
      method = options;
      args =  Array.prototype.slice.call(arguments, 1);
    }

    var returnValue = this;
    this.each(function() {
      instance = $(this).data('_gridList');
      // The plugin call be called with no method on an existing GridList
      // instance to re-initialize it
      if (instance && !method) {
        instance.destroy();
        instance = null;
      }
      if (!instance) {
        instance = new DraggableGridList(this, options, draggableOptions);
        $(this).data('_gridList', instance);
      }
      if (method) {
        var r = instance[method].apply(instance, args);
        if( r !== undefined ) returnValue = r;
      }
    });

    return returnValue;
  };

}));
