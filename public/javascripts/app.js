
const VIDEOHEIGHT = 480;
const VIDEOWIDTH = 680;
var idInterval = null;
var data = null;
let images = [];
let seconds = 0;
let emotions = [];
let level;
let periods = [];
let t = 0;
let finished = false;
var x;
function choose(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

const repartitions  =  [
  [0.6, 0.9, 1],
  [0.33, 0.67, 1], //#048B9A
  [0.1, 0.4, 1],
]

window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;


function playSound(name, audio) {
  var sound = new Audio(name);
  sound.loop = false;
  audio.volume = 0.1
  window.setTimeout(() => {
    console.log("reprise")
    audio.volume=0.3
}, 2500);
  sound.play();
}

function getScoreFromEmotion(emotions) {
  let maxValue = 0;
  let maxLabel;
  for(let emotion of emotions) {
    if(emotion.Confidence>maxValue) {
      maxValue = emotion.Confidence
      maxLabel = emotion.Type
    }
  }
  let emotion = document.getElementById("emotion")
  switch(maxLabel) {
    case "HAPPY":
    case "CALM":
      //emotion.innerHTML = "😀" 
      return 10;
    case "SURPRISED":
      //emotion.innerHTML = "😮" 
      return 8;
    case "DISGUSTED":
      //emotion.innerHTML = "🤮" 
      return 6;
    case "ANGRY":
      //emotion.innerHTML = "😣" 
      return 2;
    case "SAD": 
      //emotion.innerHTML = "😢" 
      return 1;
    default:
      return 0;
  }
}
function choose(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
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

let yeahWords = ["Bien joué", "Félicitation", "Bravo", "Super !"]

function goodJob(text) {
  word = choose(yeahWords)
  talk(word+", le mot était " +  text + "!")
}

function demandeAge(){
  message="Bonjour, quel age as tu ?"
  do{
      var age = parseInt(window.prompt(message, "ex : 6"), 10);
      message="Entre un chiffre s'il-te-plait."
  }while(isNaN(age) || age < 1);
  return age;
}


function play(idPlayer, control) {
  var player = document.querySelector('#' + idPlayer);
  control = control.firstChild
  if (player.paused) {
      player.play();
      control.classList.remove('fa-volume-mute')
      control.classList.add('fa-volume-up')
  } else {
      player.pause(); 
      control.classList.remove('fa-volume-up')
      control.classList.add('fa-volume-mute')
  }
}



window.onload = function(){
  let video = document.getElementById("video");
  let audio = document.getElementById("audioPlayer");
  let canvas = document.createElement('canvas');
  let age = demandeAge();

  talk("Bienvenue sur Vocappe, Cape ou pas cape ?")

  if(age<=4) {
    t = 1 * (60*1000)
  } else if (age == 5) {
    t = 20 * (60*1000)
  } else {
    t = 25 * (60*1000)
  }


  audio.volume = 0.3;

  analyzeImage()
  
  const recognition = new SpeechRecognition();
  recognition.lang = "fr-fr";
  recognition.interimResults = false;
  recognition.continuous = true;-

  fetch("/json", {method: 'GET'}).then((response) => response.json()).then((res) => {
    data = res;
    recognition.start();
    initTest();
  })

  let i = 0;
  const dictate = (cb) => {
    recognition.onresult = (event) => {
      clearTimeout(x)
      const speechToText = event.results[i][0].transcript;
      i++;
      if(speechToText === "verre") {
        cb("vert")
      }
      console.log("Texte enfant: " + speechToText)
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

  async function initTest() {
    let rand = Math.floor(Math.random()*data.D1.length)
    images.push(data.D1[rand])
    rand = Math.floor(Math.random()*data.D2.length)
    images.push(data.D2[rand])
    rand = Math.floor(Math.random()*data.D3.length)
    images.push(data.D3[rand])
    await askQuestions(3, images)
    await calculScore()
  }

  async function askQuestions(number, images=[], level=0, timeLimit = 0) {
    let success = true;
    let hasImages = (images.length !== 0);
    let hasTimedOut = false;
    let currentImage;
    let a;

    for(let i = 0; i < number; i++) {
      
      if(timeLimit !== 0) {
        let curr = new Date()
        if(curr >= timeLimit) {
          return 
        }  
      }

      if(hasImages) {
        currentImage = images[i]
      } else {
        let proba = Math.random();
        let rank = repartitions[level];
        for(let i = 0; i < rank.length; i++) {
          if(proba < rank[i]) {
            index = rank.indexOf(rank[i])+1
            break;
          }
        }
        formattedIndex = "D"+index;  
        rand = Math.floor(Math.random()*data[formattedIndex].length)
        currentImage = data[formattedIndex][rand]
      }

      name = currentImage.name

      a = await displayQuestion(currentImage)
      success = a[0]
      hasTimedOut = a[1]

      if(!hasTimedOut) {
        if(success) {
          goodJob(name);
        } else {
          talk(name);
          a = await displayQuestion(currentImage);
          success = a[0];
          hasTimedOut = a[1];
          if(!hasTimedOut) {
            if(success) {
                goodJob(name);
                success = true;
            } else {
              talk(name)
              a = await displayQuestion(currentImage)
              success = a[0]
              hasTimedOut = a[1]
              if(!hasTimedOut) {
                if(success) {
                  goodJob(name)
                } else {
                  talk("C'est pas grave, tu feras mieux la prochaine fois")
                  success = true
                }
              } else {
                clearTimeout(x)
                console.log("TIME OUT")
              }
            }
          } else {
            clearTimeout(x)
            console.log("TIME OUT")
          }
        }
      } else {
        clearTimeout(x)
        console.log("TIME OUT")
      }
    }
  }

  
  async function calculScore() {
    let scoreTime = 0;
    let nb = 1;
    let score;
    for(let period of periods) {
      scoreTime = (scoreTime + ((10000-period)/1000)) / nb
      if(nb === 1) {
        nb++
      }
    }
    if(emotions.length !== 0) {
      let scoreEmotions = (emotions.reduce((a, b) => {return a+b}))/emotions.length
      score = scoreEmotions + scoreTime
    } else {
      score = 0
    }
    determineLevel(score)
    if(!finished) {
      await launchExercices()      
    } 
  }

  async function launchExercices() {
    let curDate = new Date()
    let middleEnd = new Date(curDate.getTime() + (t/2))
    let end = new Date(curDate.getTime() + (t))
    await askQuestions(50, [], level, middleEnd);
    talk("Nous allons refaire un test ensemble pour ré-evaluer ton niveau")
    initTest()
    finished = true;
    await askQuestions(50, [], level, end);
  }


  function determineLevel(score) {
    if(score >= 15) {
      level = 3;
    } else if(score >= 10) {
      level = 2;
    } else {
      level = 1;
    }
  }

  let displayQuestion =  async function(question) {
    clearTimeout(x)
    return new Promise((resolve, reject) => {
      let description = question.name.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      updateDOM(question);
      let startDate = new Date();
      extractEmotions(function(data) {
        emotions.push(getScoreFromEmotion(data))
      })
      x = setTimeout(() => {
          clearTimeout(x)
          resolve([true, true])
      }, 10000);
      
      dictate(function(data) {
        clearTimeout(x)
        let success = data.split(" ").includes(description.toLowerCase())
        let endDate = new Date();
        periods.push(endDate-startDate)
        if(success) {
          resolve([true, false])
        } else {
          resolve([false, false])
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
    });
      
  }
}

window.onunload = function() {
  window.clearInterval(idInterval);
}

