
const VIDEOHEIGHT = 480;
const VIDEOWIDTH = 680;
var idInterval = null;
var data = null;
let images = [];
let seconds = 0;
let emotions = [];
let level;


const repartitions  =  [
  {"D1": 0.6, "D2": 0.3, "D3": 0.1},
  {"D1": 0.33, "D2": 0.34, "D3": 0.33},
  {"D1": 0.1, "D2": 0.3, "D3": 0.6},
]

window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;


function getScoreFromEmotion(emotions) {
  let maxValue = 0;
  let maxLabel;
  for(let emotion of emotions) {
    if(emotion.Confidence>maxValue) {
      maxValue = emotion.Confidence
      maxLabel = emotion.Type
    }
  }
  switch(maxLabel) {
    case "HAPPY":
    case "CALM": 
      return 10;
    case "SURPRISED":
      return 8;
    case "DISGUSTED":
      return 6;
    case "ANGRY":
      return 2;
    case "SAD": 
      return 1;
    default:
      return 0;
  }
}


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



window.onload = function(){
  let video = document.getElementById("video");
  let canvas = document.createElement('canvas');

  analyzeImage()
  
  const recognition = new SpeechRecognition();
  recognition.lang = "fr-fr";
  recognition.interimResults = false;
  recognition.continuous = true;


  fetch("/json", {method: 'GET'}).then((response) => response.json()).then((res) => {
    data = res
    initTest()
  })

  let i = 0;
  const dictate = (cb) => {
    recognition.onresult = (event) => {
      const speechToText = event.results[i][0].transcript;
      i++;
      console.log("Texte enfant: " + speechToText)
      if(speechToText === "verre") {
        cb("vert")
      }
      cb(speechToText)
    }
  }


  function analyzeImage() {
    if (navigator.mediaDevices.getUserMedia) {       
      navigator.mediaDevices.getUserMedia({video: true, audio: false})
      .then(function(stream) {
        video.srcObject = stream;
      })
      .catch(function(error) {
        console.log("Something went wrong! 😢");
      });
  
    }
  }
  
  let repeatQuestion = function(question) {
    return new Promise(function(resolve, reject) {
      talk(question.name)
      displayQuestion(question).then((time) => {
        console.log("YEAHH en " + time)
        resolve(10000)
      }).catch((time) => {
        talk(question.name)
        displayQuestion(question).then(() => {
        resolve(10000)
        }).catch(() => {
          talk(question.name)
          talk("Tant pis, tu réessaieras plus tard.")
          resolve(10000)
        })
      })
    });
  }

  function initTest() {
    let rand = Math.floor(Math.random()*data.D1.length)
    images.push(data.D1[rand])
    rand = Math.floor(Math.random()*data.D2.length)
    images.push(data.D2[rand])
    rand = Math.floor(Math.random()*data.D3.length)
    images.push(data.D3[rand])
    recognition.start()
    let moyenne = 0;
    displayQuestion(images[0]).then((time) => {
      console.log("YEAHH IMG1 en " + time)
      moyenne = (moyenne + (10000 - (time))/1000)/2;
      displayQuestion(images[1]).then((time) => {
        console.log("YEAHH IMG2 en " + time)
        moyenne = (moyenne + (10000 - (time))/1000)/2;
        displayQuestion(images[2]).then((time) => {
          console.log("YEAHH IMG3 en " + time)
          moyenne = (moyenne + (10000 - (time))/1000)/2;
          calculScore(moyenne)
        }).catch((time) => {
          if(time !== 0){ 
            repeatQuestion(images[2]).then((time) => {
            moyenne = (moyenne + (10000 - (time))/1000)/2; 
            calculScore(moyenne)
            })
          }
        })
      }).catch((time) => {
        repeatQuestion(images[1]).then((time) => {
          displayQuestion(images[2]).then((time) => {
            console.log("YEAHH IMG3 en " + time)
            moyenne = (moyenne + (10000 - (time))/1000)/2;
            calculScore(moyenne)
          }).catch((time) => {
            if(time !== 0){ 
              console.log("Faux IMG3 en " + time)
              moyenne = (moyenne + (10000 - (time))/1000)/2;
              repeatQuestion(images[2]).then((time) => {
                moyenne = (moyenne + (10000 - (time))/1000)/2;
                calculScore(moyenne)
              })
          }
          })
        })
      })
    }).catch((time) => {
      repeatQuestion(images[0]).then(() => {
        displayQuestion(images[1]).then((time) => {
          console.log("YEAH IMG2 en "+ time)
          moyenne = (moyenne + (10000 - (time))/1000)/2;
          displayQuestion(images[2]).then((time) => {
            console.log("YEAHH IMG3 en " + time)
            moyenne = (moyenne + (10000 - (time))/1000)/2;
          }).catch((time) => {
            if(time !== 0){ 
              console.log("Faux IMG3 en " + time)
              repeatQuestion(images[2]).then((time) => {
                moyenne = (moyenne + (10000 - (time))/1000)/2;
                calculScore(moyenne)
              })
          }
          })
        }).catch((time) => {
          repeatQuestion(images[1]).then((time) => {
            displayQuestion(images[2]).then((time) => {
              console.log("YEAHH IMG3 en " + time)
              moyenne = (moyenne + (10000 - (time))/1000)/2;
            }).catch((time) => {
              if(time !== 0){ 
                console.log("Faux IMG3 en " + time)
                repeatQuestion(images[2]).then((time) => {
                  moyenne = (moyenne + (10000 - (time))/1000)/2;
                  calculScore(moyenne)
                })
              }
            })
          })
        })
      })
    })
  }
  
  function calculScore(moyenne) {
    console.log("FINISH")
    let scoreEmotions = (emotions.reduce((a, b) => {return a+b}))/emotions.length
    let scoreTime = moyenne
    let score = scoreEmotions + scoreTime
    determineLevel(score)
    launchExercices()
  }

  function launchExercices() {
    console.log(level)
  }

  function determineLevel(score) {
    if(score >= 15) {
      level = 3;
    } else if(score >= 10) {
      level = 2;
    }else {
      level = 1;
    }
  }

  let displayQuestion = function(question) {
      return new Promise(function(resolve, reject) { 
        let description = question.name.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        updateDOM(question);
        let startDate = new Date();
        extractEmotions(function(data) {
          emotions.push(getScoreFromEmotion(data))
        
        })
          console.log(data)
          let x = setTimeout(() => {
              console.log("Temps imparti")
              clearTimeout(x)
              reject(0)
          }, 20000);
          dictate(function(data) {
            clearTimeout(x)
            let success = data.split(" ").includes(description.toLowerCase())
            let endDate = new Date();
            if(success) {
              resolve(endDate-startDate)
            } else {
              reject(endDate-startDate)
            }
        })
      })
    };
  

  function extractEmotions(cb) {
    canvas.setAttribute('width', VIDEOWIDTH);
    canvas.setAttribute('height', VIDEOHEIGHT);
    canvas.getContext('2d').drawImage(video, 0, 0);
    let data = canvas.toDataURL('image/png'); 
    let file = dataURLtoFile(data, 'face.png');

    const form = new FormData()
    form.append('data',file,'face.png')
    fetch("/image", {
        method: 'POST',
        body: form,
    })
    .then((response) => response.json())
    .then((data)=>{
      cb(data)
    })
    .catch(error => {
      console.log("error")
      return null;  
    });
      
  }
}

window.onunload = function() {
  window.clearInterval(idInterval);
}

