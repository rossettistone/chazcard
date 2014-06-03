'use strict';

var context;
var synth = {};
var graphic;
var emitter;
var webAudioExists = false;

$(function() {
  FastClick.attach(document.body);
});

angular.module('ChazCard', [])
.controller('MainCtrl', ['$scope', '$http', function ($scope, $http) {

  $scope.songs = [];

  $http.get('songData.json').success(function (data) {
    $scope.songs = data;
  });

  $scope.notes = [
    {
      name: 'C',
      hz: 261.63
    },
    {
      name: 'C#/Db',
      hz: 277.18
    },
    {
      name: 'D',
      hz: 293.66
    },
    {
      name: 'D#/Eb',
      hz: 311.13
    },
    {
      name: 'E',
      hz: 329.63
    },
    {
      name: 'F',
      hz: 349.23
    },
    {
      name: 'F#/Gb',
      hz: 369.99
    },
    {
      name: 'G',
      hz: 392.00
    },
    {
      name: 'G#/Ab',
      hz: 415.30
    },
    {
      name: 'A',
      hz: 440.00
    },
    {
      name: 'A#',
      hz: 466.16
    },
    {
      name: 'B',
      hz: 493.88
    },
    {
      name: 'C',
      hz: 523.25
    }
  ];

  $scope.playNote = function (pitch) {
    var n;
    if (typeof pitch === 'number') {
      n = new Pluck(parseFloat(pitch));
    } else if (typeof pitch === 'string') {
      for (var i = 0; i < $scope.notes.length; i++) {
        var notename = $scope.notes[i].name;
        if (notename === pitch) {
          n = new Pluck($scope.notes[i].hz);
          break;
        }
      }
    }
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
};


var setup = function(){
  checkFeatureSupport();

  if(typeof(context) !== 'undefined'){
    webAudioExists = true;
  }

  if(webAudioExists){
    synth = new Synth();
  }
};

function map_range (value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function Pluck (f) {
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
};

Pluck.prototype.setPitch = function(p){
  this.osc.frequency.value = p;
};

Pluck.prototype.setFilter = function(f){
  this.filter.frequency.value = f;
};

Pluck.prototype.setVolume= function(v){
  this.gain.gain.value = v;
  this.volume = v;
};

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
};

Pluck.prototype.stop = function(){
  return false;
};

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
};

Drone.prototype.setPitch = function(p){
  this.osc.frequency.value = p;
};

Drone.prototype.setFilter = function(f){
  this.filter.frequency.value = f;
};

Drone.prototype.setVolume= function(v){
  this.gain.gain.value = v;
  this.volume = v;
};

Drone.prototype.play = function(){
  this.osc.noteOn(0); // Play instantly
};

Drone.prototype.stop = function(){
    this.setVolume(0);
    this.osc.disconnect();
    return false;
};

function Synth(){
   this.activated =  false;
   this.notes = [220, 440, 880, 880*2];
   this.drones = [];
   this.droneRoot = randArray([146.83, 196, 220.00]);
}

Synth.prototype.touchActivate = function(){
  var n = new Pluck(146.83*2);
  n.play();
  this.drones.forEach(function(d){
    d.stop();
  });
  this.drones = [];
  this.drones[0] = new Drone(this.droneRoot/2);
  this.drones[1] = new Drone(this.droneRoot);
  this.activated =  true;
};

Synth.prototype.touchDeactivate = function (e) {
  this.activated = false;

  this.drones.forEach(function(d){
    d.stop();
  });
};

var randArray = function (a) {
  return a[Math.round(Math.random()*(a.length-1))];
};
