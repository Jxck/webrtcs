var localVideo = document.getElementById('local-video');
var remoteVideo = document.getElementById('remote-video');
var localStream = null;
var peerConnection = null;
var peerStarted = false;
var mediaConstraints = {'mandatory': {'OfferToReceiveAudio':true, 'OfferToReceiveVideo':true }};

// ----------------- handshake --------------
var localSDP = document.getElementById('localSdp');
var remoteSDP = document.getElementById('remoteSdp');
var localICE = document.getElementById('localIce');
var remoteICE = document.getElementById('remoteIce');
var iceSeparator = '------ ICE Candidate -------';
var CR = String.fromCharCode(13);

function sendSDP(sdp) {
  var text = JSON.stringify(sdp);
  console.log("---sending sdp text ---");
  console.log(text);
  localSDP.value = text;
}

function recvSDP() {
  var text = remoteSDP.value;
  var sdp = JSON.parse(text);
  if (peerConnection) {
    onAnswer(sdp);
  } else {
    onOffer(sdp);
  }
  remoteSDP.value ="";
}

function onOffer(sdp) {
  console.log("Received offer...", sdp);

  // set offer
  peerConnection = prepareNewConnection();
  peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));

  // send answer
  console.log('sending Answer. Creating remote session description...');

  peerConnection.createAnswer(function success(sdp) {
    peerConnection.setLocalDescription(sdp);

    console.log("Sending: SDP", sdp);
    sendSDP(sdp);
  }, function error() {
    console.log("Create Answer failed");
  }, mediaConstraints);
}

function onAnswer(sdp) {
  console.log("Received Answer...", sdp);
  peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
}

//--- multi ICE candidate ---
function recvICE() {
  var text = remoteICE.value;
  var arr = text.split(iceSeparator);
  for (var i = 1, len = arr.length; i < len; i++) {
    var evt = JSON.parse(arr[i]);
    onCandidate(evt);
  }

  remoteICE.value ="";
}



function onCandidate(evt) {
  var candidate = new RTCIceCandidate({sdpMLineIndex:evt.sdpMLineIndex, sdpMid:evt.sdpMid, candidate:evt.candidate});
  console.log("Received Candidate...")
    console.log(candidate);
  peerConnection.addIceCandidate(candidate);
}


function sendCandidate(candidate) {
  var text = JSON.stringify(candidate);
  console.log("---sending candidate text ---");
  console.log(text);

  localICE.value = (localICE.value + CR + iceSeparator + CR + text + CR);
  localICE.scrollTop = localICE.scrollHeight;
}

// ---------------------- video handling -----------------------
// start local video
function startVideo() {
  var config = {video: false, audio: false};
  navigator.webkitGetUserMedia(config, function success(stream) {
    localStream = stream;
    localVideo.src = window.webkitURL.createObjectURL(stream);
    localVideo.play();
    localVideo.volume = 0;
  }, function error(err) {
    console.error(err, err.code)
  });
}

// stop local video
function stopVideo() {
  localVideo.src = "";
  localStream.stop();
}

// ---------------------- connection handling -----------------------
function prepareNewConnection() {
  var pc_config = {"iceServers":[]};
  var peer = null;
  try {
    peer = new webkitRTCPeerConnection(pc_config);
  } catch (e) {
    console.log("Failed to create peerConnection, exception: " + e.message);
  }

  // send any ice candidates to the other peer
  peer.onicecandidate = function (evt) {
    if (evt.candidate) {
      console.log(evt.candidate);
      sendCandidate({type: "candidate", 
        sdpMLineIndex: evt.candidate.sdpMLineIndex,
        sdpMid: evt.candidate.sdpMid,
        candidate: evt.candidate.candidate}
        );
    } else {
      console.log("End of candidates. ------------------- phase=" + evt.eventPhase);
    }
  };

  console.log('Adding local stream...');
  // peer.addStream(localStream);

  peer.addEventListener("addstream", onRemoteStreamAdded, false);
  peer.addEventListener("removestream", onRemoteStreamRemoved, false)

    // when remote adds a stream, hand it on to the local video element
    function onRemoteStreamAdded(event) {
      console.log("Added remote stream");
      remoteVideo.src = window.webkitURL.createObjectURL(event.stream);
    }

  // when remote removes a stream, remove it from the local video element
  function onRemoteStreamRemoved(event) {
    console.log("Remove remote stream");
    remoteVideo.src = "";
  }

  return peer;
}

function sendAnswer(evt) {
}

// -------- handling user UI event -----
// start the connection upon user request
function connect() {
  if (peerStarted) return;
  //if (!peerStarted && localStream && channelReady) {
  //if (!peerStarted && localStream) {
  //  sendOffer();
  //  peerStarted = true;
  //} else {
  //  alert("Local stream not running yet - try again.");
  //}
  peerConnection = prepareNewConnection();
  peerConnection.createOffer(function (sessionDescription) { // in case of success
    peerConnection.setLocalDescription(sessionDescription);
    console.log("Sending: SDP", sessionDescription);
    sendSDP(sessionDescription);
  }, function () { // in case of error
    console.log("Create Offer failed");
  }, mediaConstraints);

  peerStarted = true;
}

// stop the connection upon user request
function hangUp() {
  console.log("Hang up.");
  stop();
}

function stop() {
  peerConnection.close();
  peerConnection = null;
  peerStarted = false;
}

window.onload = function() {
  var $startVideo = document.getElementById("startVideo");
  var $stopVideo  = document.getElementById("stopVideo");
  var $conect     = document.getElementById("connect");
  var $hangUp     = document.getElementById("hangUp");

  $startVideo.onclick = startVideo;
  $stopVideo.onclick = stopVideo;
  $conect.onclick = connect;
  $hangUp.onclick = hangUp;

  var $recvSDP = document.getElementById("recvSDP");
  var $recvICE = document.getElementById("recvICE");

  $recvSDP.onclick = recvSDP;
  $recvICE.onclick = recvICE;
}
