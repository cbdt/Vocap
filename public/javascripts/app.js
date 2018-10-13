
var idInterval = null;
var data = null;
let images = [];
let seconds = 0;

function updateDOM(obj){
  var img = document.getElementById("image");
  img.src=obj.img;
  var text = document.getElementById("description");
  text.innerHTML=obj.name.toUpperCase();
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


window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;



window.onload = function(){
  let video = document.getElementById("video");
  let canvas = document.createElement('canvas');
  let text = document.getElementById("emotion");
  let record = document.getElementById("record");
  let paragraph = document.createElement('p');
  let container = document.querySelector('.text-box');
  

  container.appendChild(paragraph);


  const recognition = new SpeechRecognition();
  recognition.lang = "fr-fr";
  recognition.interimResults = false;


  fetch("/json", {method: 'GET'}).then((response) => response.json()).then((res) => {
    data = res
    initTest()
  })

  const dictate = () => {
    record.firstChild.classList.add("active");
    recognition.start()
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      record.classList.remove("active");
      paragraph.textContent = speechToText;
    }
  }



  record.addEventListener("click", () => {
    dictate()
  })

  function incrementSeconds() {
    seconds++;
  }



  function initTest() {
    let rand = Math.floor(Math.random()*data.D1.length)
    images.push(data.D1[rand])
    rand = Math.floor(Math.random()*data.D2.length)
    images.push(data.D2[rand])
    rand = Math.floor(Math.random()*data.D3.length)
    images.push(data.D3[rand])
    let currentImage = images[2]
    updateDOM(currentImage)
    var int1 = setInterval(incrementSeconds, 1000);
    
    if(seconds === 10) {

    }
  }

  

  

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
    })
    .then((response) => response.json())
    .then((data)=>{
      let maxLabel = ""
      let maxValue = 0
      for(emotion of data) {
        if(emotion.Confidence > maxValue) {
          maxValue = emotion.Confidence;
          maxLabel = emotion.Type
        }
      }
      text.innerHTML =  maxLabel
    })
    .catch(error => console.log("error"));
      
  }
  if (navigator.mediaDevices.getUserMedia) {       
    navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(function(stream) {

      video.srcObject = stream;
      idInterval = setInterval(sendImage, 4000)
    })
    .catch(function(error) {
      console.log("Something went wrong! 😢");
    });

  }
}

window.onunload = function() {
  window.clearInterval(idInterval);
}

