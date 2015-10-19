
var CG = CG || {};

CG.CircleGauge = function( container , options ) {
  this.container = container;

  var defaults = {
    innerColor : "#305683",
    outerColor : "#5178a6",
    textColor : "#ffffff",

    valueMin : 0,
    valueMax : 100,

    angleStart : 90,

    valueFormatter : function( v ) { return v.toFixed( 1 ) + "%"; }
  };

  this.options = {};

  var key;
  for( key in defaults )
  {
    this.options[ key ] = options.hasOwnProperty( key ) ? options[ key ] : defaults[ key ];
  }

  this.options.angleStart = this.options.angleStart * Math.PI / 180;

  this.width = this.height = 0;
  this.animationValue = this.value = this.options.valueMin;
  this.isAnimating = false;

  this.canvas = document.createElement( "canvas" );
  this.container.appendChild( this.canvas );

  this.ctx = this.canvas.getContext( "2d" );

  this.resize();
};

CG.CircleGauge.prototype.resize = function() {
  this.width = this.container.clientWidth;
  this.height = this.container.clientHeight;

  if( this.width > this.height )
  {
    this.canvas.style.marginLeft = Math.floor( ( this.width - this.height ) / 2 ) + "px";
    this.canvas.style.marginTop = "0";
    this.width = this.height;
  }
  else if( this.height > this.width )
  {
    this.canvas.style.marginTop = Math.floor( ( this.height - this.width ) / 2 ) + "px";
    this.canvas.style.marginLeft = "0";
    this.height = this.width;
  }

  this.canvas.setAttribute( "width" , this.width );
  this.canvas.setAttribute( "height" , this.height );

  this.redraw();
};

CG.CircleGauge.prototype.redraw = function() {
  if( this.width === 0 || this.height === 0 ) return;

  var midx = Math.floor( this.width / 2 );
  var midy = Math.floor( this.height / 2 );

  this.ctx.clearRect( 0 , 0 , this.width , this.height );

  this.ctx.beginPath();
  this.ctx.fillStyle = this.options.innerColor;
  this.ctx.arc( midx , midy , midx * 0.6 , 0 , Math.PI * 2 );
  this.ctx.fill();

  if( this.animationValue !== this.options.valueMin )
  {
    var currentAngle = ( this.animationValue - this.options.valueMin ) / ( this.options.valueMax - this.options.valueMin );
    currentAngle = currentAngle * Math.PI * 2 + this.options.angleStart;

    this.ctx.beginPath();
    this.ctx.fillStyle = this.options.outerColor;
    this.ctx.arc( midx , midy , midx * 0.67 , this.options.angleStart , currentAngle );
    this.ctx.arc( midx , midy , midx * 0.8 , currentAngle , this.options.angleStart , true  );
    this.ctx.closePath();
    this.ctx.fill();
  }

  this.ctx.beginPath();
  this.ctx.fillStyle = this.options.textColor;
  this.ctx.font = ( this.width / 10 ) + "px sans-serif";
  this.ctx.textAlign = "center";
  this.ctx.textBaseline = "middle";
  this.ctx.fillText( this.options.valueFormatter( this.animationValue ) , midx , midy );
};

CG.CircleGauge.prototype.updateValue = function( newValue ) {
  this.value = Math.min( this.options.valueMax , Math.max( this.options.valueMin , newValue ) );

  if( !this.isAnimating )
  {
    this.isAnimating = true;
    setTimeout( this.updateAnimation.bind( this ) , 50 );
  }
};

CG.CircleGauge.prototype.updateAnimation = function() {
  this.animationValue += ( this.value - this.animationValue ) / 2;
  if( Math.abs( this.value - this.animationValue ) / ( this.options.valueMax - this.options.valueMin ) < 0.001 )
  {
    this.animationValue = this.value;
    this.isAnimating = false;
  }
  else
  {
    setTimeout( this.updateAnimation.bind( this ) , 50 );
  }
  this.redraw();
};
