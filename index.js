const info= document.querySelector("#info");
const btnnew = document.querySelector("#btn-default");
const btnstop = document.querySelector("#btn-stop");
const btnclone = document.querySelector("#btn-clone");

const backLayer= document.querySelector("#backLayer");
const mapLayer= document.querySelector("#map");
const penguinsLayer= document.querySelector("#penguinsLayer");
const artifactsLayer= document.querySelector("#artifactsLayer");
const dots= document.querySelector("#dots");
const score = document.querySelector("#score");
const islandName = document.querySelector("#islandName");

const imgsun = document.querySelector("#sun");
const imgrain = document.querySelector("#rain");
const imgcold = document.querySelector("#cold");
const imgsnow = document.querySelector("#snow");
const imgendgame = document.querySelector("#endgame");

// const dots = document.querySelector(".toplayer");

const islandsList = document.querySelector("#islandsList");
const penguinsList = document.querySelector("#penguins");

const list = document.querySelector("#penguins");
let sessionLink = null;

let tiles = 0;
let fishes = 0;

let sessionId = 0;
let move = false;
let endgame = false;
let intervalId = 0;
let mapIntervalId = 0;
let lastWeather = "";
let islandId = 0;
let boxPenguinCounter = 0;
let boxPenguinId = 0;
let intTime = 864 ; // 1728; // 864;
let debug = false;
let lastTime = new Date().getTime();
const baseTime = new Date().getTime();

// const baseURL = "http://64.227.64.163:3001/";
const baseURL = "http://localhost:3001/"
let hasPenguins = false;

const convert = async (request) => {

  try {
    const fetchResult = await fetch(request); //Making the req
    const result = await fetchResult.json(); // parsing the response

    if (fetchResult.ok) {
      return result; // return success object
    }

    // No success => we stop everything
    console.log("Connetion error");
    cleanIt();

    const responseError = {
      type: 'Error',
      message: result.message || 'Something went wrong',
      data: result.data || '',
      code: result.code || '',
    };

    const error = new Error();
    error.info = responseError;
    // console.dir(error);
    return (error);

  } catch {
    // No success => we stop everything
    console.log("Connection error");
  }
}

const refreshIsland = (data) => {

  backLayer.innerHTML = `<div><img src="./tiles/waves-back.png"></div>`;

  if (debug) {
    let size = new TextEncoder().encode(JSON.stringify(data)).length;
    let time = new Date().getTime();
    console.log(`${time - baseTime} index.js - refresh : ` + size);
  }

  if (data.weather==="endgame") {
    move = false;
    endgame = true;
    btnstop.src="./tiles/TTP-start.png";
  }

  if (data) {
    if (lastWeather !== data.weather) {
      if (debug) {
        let time = new Date().getTime();
        console.log(`${time - baseTime} index.js - refresh : Changing weather to ${data.weather}`);
      };
      imgsun.style = data.weather==="sun"?"opacity:1":"opacity:0";
      imgrain.style = data.weather==="rain"?"opacity:1":"opacity:0";
      imgcold.style = data.weather==="cold"?"opacity:1":"opacity:0";
      imgsnow.style = data.weather==="snow"?"opacity:1":"opacity:0";
      imgendgame.style = data.weather==="endgame"?"opacity:1":"opacity:0";
      lastWeather = data.weather;
    }

    let result = `<div>`;
    let line = 0;
    if (debug) {
      let time = new Date().getTime();
      console.log(`${time - baseTime} index.js - refreshIsland : Changing tiles`);
    };
    data.island.forEach(tile => {
      if (line !== tile.li) {
        result += "</div><div>";
        line = tile.li;
      }
      result += `<img class="tile" id="img-${tile.id}" src="./tiles/PF-${tile.ti}.png" width="48" height="48">`;
    });
    result += "</div>";

    mapLayer.innerHTML = result;

    artifactsLayer.innerHTML = data.artifacts;
    let infotxt = "<div>";
    for (let i=0;i<data.tiles && i < 8;i++) { infotxt += `<img src="./tiles/smalltile.png">`};
    infotxt += "&nbsp;</div><div>";
    for (let i=0;i<data.fishes && i < 8;i++) { infotxt += `<img src="./tiles/smallfish.png">`};
    infotxt += "</div>"
    info.innerHTML = infotxt;
    this.tiles = data.tiles;
    this.fishes = data.fishes;
    // score.innerHTML = data.points;
    islandName.textContent = data.islandName + " (" + data.islandSize + " tile)";
    islandId = data.islandId;
    listPenguins(data.penguins);
  }
}

const movePenguinLeft = (aPenguin,cur, stop, cat) => {
  function loopLeft() {
    aPenguin.style.left = cur + "px";
    if (cur-- > stop) {
      window.requestAnimationFrame(loopLeft);
    } else {
      aPenguin.src = `./tiles/peng${cat}0-1.png`
    }
  }
  window.requestAnimationFrame(loopLeft);
}

const movePenguinRight = (aPenguin,cur, stop, cat) => {
  function loopRight() {
    aPenguin.style.left = cur + "px";
    if (cur++ < stop) {
      window.requestAnimationFrame(loopRight);
    } else {
      aPenguin.src = `./tiles/peng${cat}0-2.png`
    }
  }
  window.requestAnimationFrame(loopRight);
}

const movePenguinUp = (aPenguin,cur, stop, cat) => {
  function loopUp() {
    aPenguin.style.top = cur + "px";
    if (cur-- > stop) {
      window.requestAnimationFrame(loopUp);
    } else {
      aPenguin.src = `./tiles/peng${cat}0-3.png`
    }
  }
  window.requestAnimationFrame(loopUp);
}

const movePenguinDown = (aPenguin,cur, stop, cat) => {
  function loopDown() {
    aPenguin.style.top = cur + "px";
    if (cur++ < stop) {
      window.requestAnimationFrame(loopDown);
    } else {
      aPenguin.src = `./tiles/peng${cat}0-4.png`
    }
  }
  window.requestAnimationFrame(loopDown);
}

const refreshMoves = (data) => {
  if (data) {
    if (data.moves) {
      // console.dir(data.moves);
      data.moves.forEach(move => {

        let aPenguin = document.querySelector(`#peng${move.id}`);
        // console.log(move.id);
        // if (aPenguin) {

          switch (move.moveType) {
          case 1:
            if (move.movements[0].moveDir === 0) {
              if (debug) {
                let time = new Date().getTime();
                console.log(`${time - baseTime} index.js - refresh : ${move.moveid}/${move.movements[0].movmtid}: placing ${move.id} at ${move.movements[0].newH}/${move.movements[0].newL} (${move.cat})`);
              }

              let id = move.id;
              let l = (move.movements[0].newL * 48) + 16;
              let h = (move.movements[0].newH * 48) + 16;
              let pengNum = move.num > 6 ? "x" : move.num + 1;
              let tag = `<img id="peng${id}" class="penguin" style="left: ${l}px; top: ${h}px; position: absolute" src="./tiles/peng${move.cat}0.png" width="48" height="48">`;

              penguinsLayer.insertAdjacentHTML("beforeEnd",tag);
              move.movements.shift();
              aPenguin = document.querySelector(`#peng${move.id}`);
              aPenguin.addEventListener("click", () => {
                selectPenguin(move.id);
              });


            }
            if (move.movements.length > 0) {
              for (let cur =0; cur < move.movements.length; cur++) {
                aPenguin.src=`./tiles/peng${move.cat}move-${move.movements[cur].moveDir}.gif`;
                let startL = (move.movements[cur].origL * 48) + 16;
                let stopL = (move.movements[cur].newL * 48) + 16;
                let startH = (move.movements[cur].origH * 48) + 16;
                let stopH = (move.movements[cur].newH * 48) + 16;
                switch (move.movements[cur].moveDir) {
                  case 1 :
                    movePenguinLeft(aPenguin,startL,stopL,move.cat);
                    break;
                  case 2 :
                    movePenguinRight(aPenguin,startL,stopL,move.cat);
                    break;
                  case 3 :
                    movePenguinUp(aPenguin,startH,stopH, move.cat);
                    break;
                  case 4 :
                    movePenguinDown(aPenguin,startH,stopH, move.cat);
                    break;
                }
              }
            }

            break;
          case 2: // age
            if (debug) {
              let time = new Date().getTime();
              console.log(`${time - baseTime} index.js - refresh : ${move.moveid} / ${move.id} moveType 2 (grow) `)
            };
            aPenguin.src=`./tiles/peng${move.cat}0.png`;
            break;
          case 3:  // eat
            if (debug) {
              let time = new Date().getTime();
              console.log(`${time - baseTime} index.js - refresh : ${move.moveid} / ${move.id} moveType 3 (eat) `)
            };
            aPenguin.src=`./tiles/penguin-eating.gif`;
            break;
          case 4: // love
            if (debug) {
              let time = new Date().getTime();
              console.log(`${time - baseTime} index.js - refresh : ${move.moveid} / ${move.id} moveType 4 (love) `)
            };
            aPenguin.src=`./tiles/penguin-loving.png`;
            break;
          case 5: // die
            if (debug) {
              let time = new Date().getTime();
              console.log(`${time - baseTime} index.js - refresh : ${move.moveid} / ${move.id} moveType 5 (die) `)
            };
            if (aPenguin) {aPenguin.remove()};
            break;
          case 6: // still
            if (debug) {
              let time = new Date().getTime();
              console.log(`${time - baseTime} index.js - refresh : ${move.moveid} / ${move.id} moveType 6 (still) `)
            };
            aPenguin.src=`./tiles/peng${move.cat}0.png`;
            break;
          case 7: // fishing
            if (debug) {
              let time = new Date().getTime();
              console.log(`${time - baseTime} index.js - refresh : ${move.moveid} / ${move.id} moveType 7 (fish - ${move.direction}) `)
            };
            aPenguin.src=`./tiles/peng-m-${move.direction}-fishing.png`;
            break;
          }
        // }
      });
      score.textContent = data.points;
    }
  } else {
    cleanIt();
  }
}

// cleans everything so a new game can be started - or a view to another session

const cleanIt = () => {

  if (debug) {
    let time = new Date().getTime();
    console.log(`${time - baseTime} index.js - cleanIt`);
  }

  clearInterval(intervalId);
  clearInterval(mapIntervalId);
  mapLayer.innerHTML = "";
  backLayer.innerHTML = "";
  artifactsLayer.innerHTML = "";
  penguinsLayer.innerHTML = "";
  islandName.innerHTML = "";
  score.innerHTML = "";
  list.innerHTML = "";
  info.innerHTML = ""; //"<div>No connection</div>"
  hasPenguins = false;

  imgsun.style = "opacity:0";
  imgrain.style = "opacity:0";
  imgcold.style = "opacity:0";
  imgsnow.style = "opacity:0";

  lastWeather = "";

  // btnstop.textContent = "Start";
  move = false;
}

// This method is called after a connection error - it resets everything

const handleConnectionError = (error) => {
  console.log("error in getNewMap");
  console.dir(error);
  renew = true;
  islandId = 0;
  sessionId = 0;
  cleanIt();
  btnstop.src="./tiles/TTP-start.png";
  backLayer.innerHTML = `<div></div>`;
}



const getNewMap = () => {

  if (debug) {
    let time = new Date().getTime();
    console.log(`${time - baseTime} index.js - getNewMap`);
  }

  cleanIt();
  convert(baseURL + "new-island?sessionId=" + sessionId)
  .then(data => {
    refreshIsland(data);
    refreshMoves(data);
  })
  .catch(error =>{
    handleConnectionError(error);
  });
}

const getMap = () => {

  if (debug) {
    let time = new Date().getTime();
    console.log(`${time - baseTime} index.js - getMap`);
  }

  if (sessionId) {
    convert(baseURL + "island?sessionId=" + sessionId + "&renew=0")
    .then(data => {
      refreshIsland(data);
      refreshMoves(data);
    });
  } else {
    convert(baseURL + "island")
    .then(data => {
      console.log("Getting a new session ID " + data.session);
      if (data) {
        refreshIsland(data);
        refreshMoves(data);
        sessionId = data.session;
      } else {
        console.log("No data received while asking for a new session ID");
        cleanIt();
      }
    })
    .catch(error => {
      handleConnectionError(error);
    });
  }
}

const connectIsland = (islandId) => {
  cleanIt();
  convert(baseURL + "connect-island?sessionId=" + sessionId + "&islandId=" + islandId)
  .then(data => {
    refreshIsland(data);
    refreshMoves(data);
    move = true;
  })
  .catch(error =>{
    handleConnectionError(error);
  });

}

const setTile = (X,Y) => {

  if (! sessionId) {
    return;
  }

  let offset = document.querySelector(".area").offsetTop;

  let h = (X - 16) / 48;
  let l = (Y - 16 - offset) / 48;
  convert(baseURL + "setTile?sessionId=" + sessionId + "&hpos=" + h + "&lpos=" + l)
  .then(data => {
    refreshIsland(data);
  })
  .catch(error =>{
    handleConnectionError(error);
  });
}

const listPenguins = (penguins) => {

  let txt = '';
  for (let i=0; penguins &&  i< penguins.length; i++) {
    if(penguins[i].alive) {

      let color = penguins[i].wealth > 30 && penguins[i].hungry < 70 ? "#D0F5A9" : "#ff6666";
      let bold = penguins[i].id === Number.parseInt(boxPenguinId,10) ?"bold":"normal" ;
      let gauge = penguins[i].wealth < 10 ? 0: Math.floor(penguins[i].wealth/20);
      let hunger = penguins[i].hungry > 90 ? 5: Math.floor(penguins[i].hungry/20);
      let fattxt = ["meager","thin","strong","fat"][penguins[i].fat];

      // console.log("---->" + gauge + "<-->" + hunger + "<--");

      txt += `<li id="${penguins[i].id}" style="font-weight:${bold}; color:${color}">${penguins[i].id === boxPenguinId? ">>":""} ${penguins[i].name} (${penguins[i].gender[0]} / ${Math.floor(penguins[i].age)} / ${fattxt}) <img src="./tiles/health-${gauge}.png" height=16px> / <img src="./tiles/hunger-${hunger}.png" height=16px> ${penguins[i].strategyShort}</li>` ;
    }
  }

  list.innerHTML = txt;
}

const getIslands = () => {
  convert(baseURL + "islands")
  .then(data => {

    let txt = '', i=0;
    data.islands.forEach(island => {
      //if (island.id === Number.parseInt(islandId,10)) {
      //  txt += `<li id="0">${anIsland.name} (${island.points}/${island.running?"run":"over"})</li>` ;
      //} else {
        txt += `<li id="${island.id}" class="sessionLink">${island.name} (${island.points} / ${island.running?"running":"ended"})</li>` ;
      //}
    });
    islandsList.innerHTML = txt;
  });
}

const getIslandMoves = () => {

  if (! sessionId) {
    return;
  }
  convert(baseURL + `islandmoves?sessionId=${sessionId}`)
  .then(data => {
    refreshIsland(data);
  })
  .catch(error => {
    handleConnectionError(error);
  });

};

const getMoves = (renew,followId=0) => {

  if (! sessionId) {
    return;
  }

  // if it's a renew the penguin layer is first emptied

  if (renew) {
    if (debug) { console.log("Renewing the penguins") };
    penguinsLayer.innerHTML = "";
  }

  convert(baseURL + `moves?renew=${renew?1:0}&followId=${followId}&sessionId=${sessionId}`)
  .then(data => {
    refreshMoves(data);
  })
  .catch(error => {
    handleConnectionError(error);
  });

};

const selectPenguin = (penguinId) => {

  console.log("penguin selected : " + penguinId);

  if (boxPenguinId > 0) {
    let aPenguin = document.querySelector(`#peng${boxPenguinId}`);
    if (aPenguin) {
      aPenguin.style.backgroundColor ="";
      aPenguin.style.borderRadius = "0px";
      aPenguin.style.boxShadow = "";
    }
  }

  boxPenguinId = penguinId;

  boxPenguinCounter = 20;

  let aPenguin = document.querySelector(`#peng${boxPenguinId}`);
  if (aPenguin) {
    aPenguin.style.backgroundColor =  "rgba(255, 195, 0, 0.5)";
    aPenguin.style.borderRadius = "25px";
    aPenguin.style.boxShadow = "0 0 20px #FFC300  ";
  }
}


//
// SIDEBAR
//

/* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
  document.getElementById("allscreen").style.marginLeft = "250px";
}

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
  document.getElementById("allscreen").style.marginLeft = "0";
}

//
// LISTENERS
//

islandsList.addEventListener("click", (li) => {
  let islandId = li.target.id;
  closeNav();
  cleanIt();
  move = true;
  intervalId = startInterval(true,islandId);
});

penguinsList.addEventListener("click", li => {
  selectPenguin(li.target.id);
});

btnclone.addEventListener("click", () => {
  openNav();
});

btnnew.addEventListener("click", () => {
  getNewMap();
  move = true;
  endgame = false;
  btnstop.src="./tiles/TTP-stop.png";
  mapIntervalId = startMapInterval();
  intervalId = startInterval(false);

});

btnstop.addEventListener("click", () => {
  if (endgame) {
    getNewMap();
    move = true;
    endgame = false;
    btnstop.src="./tiles/TTP-stop.png";
    mapIntervalId = startMapInterval();
    intervalId = startInterval(false);
  } else if ( ! move) {
    move = true;
    renew = false;
    btnstop.src="./tiles/TTP-stop.png";
    mapIntervalId = startMapInterval();
    intervalId = startInterval(true,islandId);
  } else {
    if (debug) {
      let time = new Date().getTime();
      console.log(`${time - baseTime} index.js - btnstop.addEventListener : stopping interval`);
    }
    cleanIt();
    btnstop.src="./tiles/TTP-start.png";
  }
});

dots.addEventListener("click", () => {
  if (move) {
    // console.log("dot click");
    setTile(event.clientX,event.clientY);
  }
});

// Main interval - can be started with an island id (in that case the session will be connected bac-end t=with that island)

const startInterval = (renew,islandId=0) => {

  backLayer.innerHTML = `<div><img src="./tiles/waves-back.png"></div>`;

  // let isFirst = true;
  if (islandId > 0) {
    if (debug) {
      let time = new Date().getTime();
      console.log(`${time - baseTime} index.js - startInterval : starting interval with island id ${islandId}`);
    }
    connectIsland(islandId);
  } else if (renew) {
    if (debug) {
      let time = new Date().getTime();
      console.log(`${time - baseTime} index.js - startInterval : starting interval`);
    }
    getMap();
    getMoves(true);
  }
  return setInterval(() => {
    let newTime = new Date().getTime();
    let renewInterval = Math.floor((newTime - lastTime) / 1000);
    lastTime = newTime;

    // To generate a halo around the selected penguin

    boxPenguinCounter -= boxPenguinCounter > 0? 1:0;
    if ( boxPenguinCounter < 1) {
    let aPenguin = document.querySelector(`#peng${boxPenguinId}`);
      if (aPenguin) {
        aPenguin.style.backgroundColor ="";
        aPenguin.style.borderRadius = "0px";
        aPenguin.style.boxShadow = "";
      }
      boxPenguinId = 0;
    }
    getMoves(renewInterval > 4,boxPenguinCounter > 1? boxPenguinId:0);
    getIslands();

    // isFirst = false;
  }, intTime);
}

const startMapInterval = () => {
  return setInterval(() => {
    getIslandMoves();
  }, intTime * 2);
}
