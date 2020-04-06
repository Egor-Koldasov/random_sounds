var soundStructModel = {
  cycleLength: 2,
  getAudio: (i) => i,
};

var updateSoundStruct = (getAudio, info) => (soundStr) => ({
  ...soundStr,
  ...info,
  getAudio: (i) => getAudio(soundStr)(soundStr.getAudio(i)),
});

var cycleSound = (cycleLength) => updateSoundStruct(
  (soundStr) => (i) => {
    var cyclesPassed = Math.floor(i / cycleLength);
    var cycleI = i - cyclesPassed * cycleLength;
    return cycleI;
  },
  {cycleLength}
);
var waveCycledSound = updateSoundStruct(
  (soundStr) => (i) => {
    var wavePeakFrom0 = soundStr.cycleLength / 2;
    var waveIFrom0 = i > wavePeakFrom0 ? wavePeakFrom0 - (i - wavePeakFrom0) : i;
    const waveI = waveIFrom0 - wavePeakFrom0 / 2;
    return waveI;
  }
);

var convertToSample = () => updateSoundStruct(
  (soundStr) => (i) => {
    var value = i / (soundStr.cycleLength / 4);
    return value;
  },
);

const approximate = (numberOfValues) => updateSoundStruct(
  (soundStr) => (i) => {
    const stepLength = 4 / numberOfValues;
    const value = -1 + stepLength * Math.floor((i + 1) / stepLength);
    return value;
  },
);

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const prepareAudio = () => {
  // Create an empty three-second stereo buffer at the sample rate of the AudioContext
  var myArrayBuffer = audioCtx.createBuffer(2, audioCtx.sampleRate * 3, audioCtx.sampleRate);

  // Fill the buffer
  for (var channel = 0; channel < myArrayBuffer.numberOfChannels; channel++) {
    // This gives us the actual array that contains the data
    var nowBuffering = myArrayBuffer.getChannelData(channel);
    for (var i = 0; i < myArrayBuffer.length; i++) {
      // audio needs to be in [-1.0; 1.0]
      nowBuffering[i] = soundStruct.getAudio(i);
    }
  }
  window.soundStructUpdated = false;
  return myArrayBuffer;
}

var runAudio = () => {
  if (window.soundStructUpdated) {
    window.audioBuffer = prepareAudio();
  }

  // Get an AudioBufferSourceNode.
  // This is the AudioNode to use when we want to play an AudioBuffer
  var source = audioCtx.createBufferSource();

  // set the buffer in the AudioBufferSourceNode
  source.buffer = window.audioBuffer;

  // connect the AudioBufferSourceNode to the
  // destination so we can hear the sound
  source.connect(audioCtx.destination);
  window.soundStructUpdated = false;
  // start the source playing
  source.onended = (runAudio);
  window.audioSource = source;
  source.start();
}

window.soundStructUpdated = false;
const updateActiveSoundStruct = (soundStruct, prepareFirst) => {
  window.soundStruct = soundStruct;
  if (prepareFirst) window.audioBuffer = prepareAudio();
  else window.soundStructUpdated = true;
  if (window.audioSource) window.audioSource.stop();
}

var middleSound = updateSoundStruct(
  (soundStr) => (i) => {
    i / 2
  }
);

const test = (length = 100, numberOfValues, justPrepare) => {
  const sample = convertToSample()(waveCycledSound(cycleSound(length)(soundStructModel)));
  const approx = numberOfValues ? approximate(numberOfValues)(sample) : sample;
  updateActiveSoundStruct(approx, justPrepare);
}

test();

document.body.onclick = runAudio;

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const random = (maxWave = 500, intervalMs = 1000, randomInterval = false) => {
  if (window.randomIntId) clearTimeout(window.randomIntId);
  const interval = !randomInterval ? intervalMs : getRandomInt(5, intervalMs);
  window.randomIntId = setTimeout(
    () => {
      test(getRandomInt(4, maxWave), getRandomInt(2, 1000), true);
      window.audioSource.stop();
      random(maxWave, intervalMs, randomInterval);
    },
    interval
  );
}