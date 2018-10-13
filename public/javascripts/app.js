
var idInterval = null;
var data = null;
let images = [];
let seconds = 0;

function changeSRC(obj){
  var img = document.getElementById("image");
  img.src=obj.img;
  var text = document.getElementById("description");
  text.innerHTML=data.nom;
}
function dataURLtoFile(dataurl, filename) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type:mime});
}

function talk(text) {
  ssu = new SpeechSynthesisUtterance()
  ssu.lang = "fr-FR"
  ssu.text = text
  speechSynthesis.speak(ssu)
}

window.AudioContext = window.AudioContext ||
                      window.webkitAudioContext;

const context = new AudioContext();



window.onload = function(){

  function incrementSeconds() {
    seconds++;
  }
  fetch("/json", {method: 'GET'}).then((response) => response.json()).then((res) => {
    data = res
    initTest()
  })


  function initTest() {

    let rand = Math.floor(Math.random()*data.D1.length)
    images.push(data.D1[rand])
    rand = Math.floor(Math.random()*data.D2.length)
    images.push(data.D2[rand])
    rand = Math.floor(Math.random()*data.D3.length)
    this.images.push(data.D3[rand])
    let currentImage = images[2]
    changeSRC(currentImage)
    var int1 = setInterval(incrementSeconds, 1000);
    
    if(seconds === 10) {

    }
  }

  

  

  //let video = document.getElementById("video");
  let canvas = document.createElement('canvas');
  let text = document.getElementById("emotion");

  function sendImage() {

    canvas.setAttribute('width', video.videoWidth);
    canvas.setAttribute('height', video.videoWidth);
    canvas.getContext('2d').drawImage(video, 0, 0);
    var data = canvas.toDataURL('image/png');
      
    let file = dataURLtoFile(data, 'face.png')
    const form = new FormData()
    form.append('data',file,'face.png')

    fetch("/image", {
        method: 'POST',
        body: form,
    }).then((response) => response.json())
    .then((data)=>{
      console.log(data)
      let maxLabel = ""
      let maxValue = 0
      for(emotion of data) {
        if(emotion.Confidence > maxValue) {
          maxValue = emotion.Confidence;
          maxLabel = emotion.Type
        }
      }
      console.log(maxLabel)
      text.innerHTML =  maxLabel
    })
    .catch(error => console.log("error"));
      
  }
  if (navigator.mediaDevices.getUserMedia) {       
    navigator.mediaDevices.getUserMedia({video: true, audio: true})
    .then(function(stream) {
      const microphone = context.createMediaStreamSource(stream);
      const filter = context.createBiquadFilter();
      // microphone -> filter -> destination
      microphone.connect(filter);
      filter.connect(context.destination);
      //video.srcObject = stream;
      //idInterval = setInterval(sendImage, 4000)
    })
    .catch(function(err0r) {
      console.log("Something went wrong!");
    });

  }
}

window.onunload = function() {
  window.clearInterval(idInterval);
}

