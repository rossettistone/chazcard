'use strict';

var context;
var synth = {};
var graphic;
var emitter;
var webAudioExists = false;

angular.module('ChazCard', ['hmTouchevents'])
.controller('MainCtrl', ['$scope', '$http', function ($scope, $http) {

  $scope.nowPlaying = []; // track notes now playing, if any

  $scope.songs = [];

  $http.get('songData.json').success(function (data) {
    $scope.songs = data;
  });

  $scope.notes = [
    { name: 'C', notes: ['C'], hz: 261.63 },
    { name: 'C#/Db', notes: ['C#', 'Db'], hz: 277.18 },
    { name: 'D', notes: ['D'], hz: 293.66 },
    { name: 'D#/Eb', notes: ['D#', 'Eb'], hz: 311.13 },
    { name: 'E', notes: ['E'], hz: 329.63 },
    { name: 'F', notes: ['F'], hz: 349.23 },
    { name: 'F#/Gb', notes: ['F#', 'Gb'], hz: 369.99 },
    { name: 'G', notes: ['G'], hz: 392.00 },
    { name: 'G#/Ab', notes: ['G#', 'Ab'], hz: 415.30 },
    { name: 'A', notes: ['A'], hz: 440.00 },
    { name: 'A#/Bb', notes: ['A#', 'Bb'], hz: 466.16 },
    { name: 'B', notes: ['B'], hz: 493.88 },
    { name: 'C', notes: ['C'], hz: 523.25 }
  ];

  $scope.playNote = function (pitch) {
    if (typeof pitch === 'number') {
      $scope.nowPlaying.push( new Drone(parseFloat(pitch)) );
    } else if (typeof pitch === 'string') {
      for (var i = 0; i < $scope.notes.length; i++) {
        var notes = $scope.notes[i].notes;
        if ( _(notes).contains(pitch) ) {
          $scope.nowPlaying.push( new Drone($scope.notes[i].hz) );
          break;
        }
      }
    }
  };

  $scope.stopNote = function () {
    $scope.nowPlaying.forEach( function (note) {
      note.stop();
    });
  }


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

function Pluck (f) {
  this.filter;
  this.gain;
  this.osc;
  this.played = false;
  this.volume = 0.5;
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

var randArray = function (a) {
  return a[Math.round(Math.random()*(a.length-1))];
};
