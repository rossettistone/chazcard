var context;
var synth= {};
var graphic;
var emitter;
var noteVal = 400;
var t = new Date();
var isDesktop = false;
var webAudioExists = false;


angular.module('ChazCard', [])
.controller('MainCtrl', ['$scope', '$http', function ($scope, $http) {

  $scope.songs = [];

  $http.get('songData.json').success(function (data) {
    $scope.songs = data;
  });

  $scope.notes = [
    {
      name: 'A4',
      hz: 440
    },
    {
      name: 'A#4',
      hz: 466.16
    },
    {
      name: 'B4',
      hz: 493.88
    },
    {
      name: 'C5',
      hz: 523.25
    },
    {
      name: 'C#5',
      hz: 554.37
    },
    {
      name: 'D5',
      hz: 587.33
    }
  ];

  $scope.playNote = function (pitch) {
    var n = new Pluck(parseFloat(pitch));
    n.play();
  };

}]);

$(document).ready(function(){
    setup();
});

var checkFeatureSupport = function(){
  try{
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    context = new AudioContext();
  }
  catch (err){
    alert('web audio not supported');
  }

  if (! (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ) {
    // some code..
    isDesktop = true;
  }
}


var setup = function(){
  checkFeatureSupport();

  if(typeof(context)!=="undefined"){
    webAudioExists = true;
  }

  if(webAudioExists){
    synth = new Synth();
  }

  emitter = new SampleBatchEmitter();

}


//touch and gesture mappings to synth and graphic
//
var touchActivate = function(e){
  e.preventDefault();

  if(webAudioExists){
    var pitch = $(e.target).data('hz');
    var n = new Pluck(pitch);
    n.play();
  }
}

var touchDeactivate = function(e){
  e.preventDefault();

  if(webAudioExists){
    synth.touchDeactivate(e);
  }
}


//sample + batch acceleration values. only submit if nonzero
function SampleBatchEmitter(){
  this.sample_rate= 30;
  this.emit_rate = 200;
  this.data = [];
  this.read = true;
  this.emitd();
  this.startTime;
}

SampleBatchEmitter.prototype.pushd = function(d){
  if(this.read===true  && graphic.activated){
    d.deltaTime = (new Date().getTime() - this.startTime);
    this.data.push(d);
    this.read = false;
    var that = this;
    setTimeout(function(){that.read = true;}, that.sample_rate);
  };
}

SampleBatchEmitter.prototype.emitd = function(){
  var that = this;
  setInterval(function(){
    that.startTime = new Date().getTime();
    if(that.data.length>0){
      that.data = [];
    }
  },that.emit_rate);
}


function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function Pluck(f){
  this.filter;
  this.gain;
  this.osc;
  this.played = false;
  this.volume = map_range(f,100,1500,0.6, 0.4);//based on F range
  this.pitch = f;
  this.buildSynth();
  this.duration = 1;
}

Pluck.prototype.buildSynth = function(){
  this.osc = context.createOscillator(); // Create sound source
  this.osc.type = 3; // Square wave
  this.osc.frequency.value = this.pitch;

  this.filter = context.createBiquadFilter();
  this.filter.type = 0;
  this.filter.frequency.value = 440;

  this.gain = context.createGain();
  this.gain.gain.value = this.volume;
  //decay
  this.osc.connect(this.filter); // Connect sound to output
  this.filter.connect(this.gain);
  this.gain.connect(context.destination);
}

Pluck.prototype.setPitch = function(p){
  this.osc.frequency.value = p;
}

Pluck.prototype.setFilter = function(f){
  this.filter.frequency.value = f;
}

Pluck.prototype.setVolume= function(v){
  this.gain.gain.value = v;
  this.volume = v;
}

Pluck.prototype.play = function(dur){
  var dur = this.duration || dur;
  this.osc.noteOn(0); // Play instantly
  this.gain.gain.setTargetAtTime(0, 0, 0.3);
  var that = this;
  setTimeout(function(){
  //this looks funny because start and stop don't work on mobile yet
  //and noteOff doesnt allow new notes
    that.setVolume(0);
    that.osc.disconnect();
  },dur*1000);
}

Pluck.prototype.stop = function(){
  return false;
}



function Drone(f){
  this.filter;
  this.gain;
  this.osc;
  this.played = false;
  this.volume = 0.5;
  this.pitch = f;
  this.buildSynth();
  this.play();
}

Drone.prototype.buildSynth = function(){
  this.osc = context.createOscillator(); // Create sound source
  this.osc.type = 2;
  this.osc.frequency.value = this.pitch;

  this.filter = context.createBiquadFilter();
  this.filter.type = 0;
  this.filter.frequency.value = 440;

  this.gain = context.createGain();
  this.gain.gain.value = this.volume;
  //decay
  this.osc.connect(this.filter); // Connect sound to output
  this.filter.connect(this.gain);
  this.gain.connect(context.destination);
}

Drone.prototype.setPitch = function(p){
  this.osc.frequency.value = p;
}

Drone.prototype.setFilter = function(f){
  this.filter.frequency.value = f;
}

Drone.prototype.setVolume= function(v){
  this.gain.gain.value = v;
  this.volume = v;
}

Drone.prototype.play = function(){
  this.osc.noteOn(0); // Play instantly
}

Drone.prototype.stop = function(){
    this.setVolume(0);
    this.osc.disconnect();
    return false;
}


function Synth(){
   this.activated =  false;
   this.notes = [220, 440, 880, 880*2];
   this.drones = [];
   this.droneRoot = randArray([146.83, 196, 220.00]);
}

Synth.prototype.touchActivate= function(e){
  var n = new Pluck(146.83*2);
  n.play();
  this.drones.forEach(function(d){
    d.stop();
  });
  this.drones = [];
  this.drones[0]= new Drone(this.droneRoot/2);
  this.drones[1]= new Drone(this.droneRoot);
  this.activated =  true;
}

Synth.prototype.touchDeactivate= function(e){
   this.activated =  false;

  this.drones.forEach(function(d){
    d.stop();
  });
}

var randArray = function(a){
  return a[Math.round(Math.random()*(a.length-1))];
}
