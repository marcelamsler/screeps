const roles = require('roles');


module.exports.loop = () => {
  doAllXTicks("spawnAndDeleteCreeps", 5, () => {
    spawnCreeps();
    cleanMemory();
  });

  for (let name in Game.creeps) {
    const creep = Game.creeps[name];

    let jobFunction = roles[creep.memory.role];

    if (jobFunction) {
      jobFunction(creep);
    }

    savePositionForStreetBuilding(creep.pos, creep.room);
  }

  doAllXTicks("buildStreets", 100, () => {
    console.log("building streets...");
    if (!Object.keys(Game.constructionSites).length) {
      buildStreets();
    }
  })
};

function spawnCreeps() {
  let maxHarvesterCount = 8;
  let maxControllerUpgrader = 5;
  const maxBuilders = 3;
  const maxMaintainers = 3;
  const maxClaimers = 2;
  const randomNumber = Math.floor((Math.random() * 10000) + 1);
  const currentHarvesterCount = Object.keys(Game.creeps).map(name => Game.creeps[name]).filter(creep => creep.memory.role === roles.HARVESTER).length;
  const currentControllerUpgraderCount = Object.keys(Game.creeps).map(name => Game.creeps[name]).filter(creep => creep.memory.role === roles.CONTROLLER_UPGRADER).length;
  const currentBuildersCount = Object.keys(Game.creeps).map(name => Game.creeps[name]).filter(creep => creep.memory.role === roles.BUILDER).length;
  const currentMaintainerCount = Object.keys(Game.creeps).map(name => Game.creeps[name]).filter(creep => creep.memory.role === roles.REPAIR).length;
  const currentClaimerCount = Object.keys(Game.creeps).map(name => Game.creeps[name]).filter(creep => creep.memory.role === roles.CLAIM).length;
  let name = "";
  let bodyParts = [];
  let role;

  if (currentHarvesterCount < maxHarvesterCount) {
    name = "Harvester" + randomNumber;
    bodyParts.push(MOVE);
    bodyParts.push(WORK);
    bodyParts.push(WORK);
    bodyParts.push(CARRY);
    role = roles.HARVESTER
  } else if (currentControllerUpgraderCount < maxControllerUpgrader) {
    name = "Upgrader" + randomNumber;
    bodyParts.push(MOVE);
    bodyParts.push(WORK);
    bodyParts.push(WORK);
    bodyParts.push(CARRY);
    role = roles.CONTROLLER_UPGRADER;
  } else if (currentBuildersCount < maxBuilders && Object.keys(Game.constructionSites).length) {
    name = "Builder" + randomNumber;
    bodyParts.push(MOVE);
    bodyParts.push(WORK);
    bodyParts.push(WORK);
    bodyParts.push(CARRY);
    role = roles.BUILDER;
  } else if (currentMaintainerCount < maxMaintainers) {
    name = "Maintainer" + randomNumber;
    bodyParts.push(MOVE);
    bodyParts.push(WORK);
    bodyParts.push(WORK);
    bodyParts.push(CARRY);
    role = roles.REPAIR;
  } else if (currentClaimerCount < maxClaimers) {
    name = "Claimer" + randomNumber;
    bodyParts.push(MOVE);
    bodyParts.push(CLAIM);
    bodyParts.push(CLAIM);
    bodyParts.push(MOVE);
    role = roles.CLAIM;
  } else {
    name = "Upgrader" + randomNumber;
    bodyParts.push(MOVE);
    bodyParts.push(WORK);
    bodyParts.push(WORK);
    bodyParts.push(CARRY);
    role = roles.CONTROLLER_UPGRADER;
  }

  let errorCode = Game.spawns[Object.keys(Game.spawns)[0]].spawnCreep(bodyParts, name, {});

  let spawningCreepFailed = errorCode < 0;
  if (spawningCreepFailed) {
    // console.log("cant spawn ", errorCode, bodyParts)
  } else {
    Game.creeps[name].memory.role = role;
    console.log("build creep with role: " + role)
  }
}

function cleanMemory() {
  for (let name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }
}

function doAllXTicks(name, ticksCount, action) {
  Memory.xTickActions = Memory.xTickActions || {};

  let xTickAction = Memory.xTickActions[name];

  if (xTickAction) {
    xTickAction.countDown--;
  } else {
    xTickAction = Memory.xTickActions[name] = {
      countDown: ticksCount
    }
  }

  if (xTickAction.countDown <= 0) {
    action();
    xTickAction.countDown = ticksCount;
  }
}

function savePositionForStreetBuilding(pos, room) {
  Memory.positionsVisited = Memory.positionsVisited || [];
  const somethingIsAtThisPosition = room.lookAt(pos.x, pos.y).filter(object => object.type === LOOK_CONSTRUCTION_SITES || object.type === LOOK_STRUCTURES).length;

  if (!somethingIsAtThisPosition) {
    const position = Memory.positionsVisited.filter(positionWithCount => {
      return positionWithCount.roomName === room.name && positionWithCount.x === pos.x && positionWithCount.y === pos.y
    });

    if (position.length) {
      position[0].count += 1;
    } else {
      Memory.positionsVisited.push({
        x: pos.x,
        y: pos.y,
        roomName: room.name,
        count: 1
      });
    }
  }

}

function buildStreets() {
  let createdRoads = 0;
  _.sortBy(Memory.positionsVisited.filter(position => position.count > 15), p => 100 - p.count).forEach(position => {
    const room = Game.rooms[position.roomName];
    const objectsAtThisPosition = room.lookAt(position.x, position.y);

    objectsAtThisPosition.forEach(object => {
      if (object.type !== LOOK_CONSTRUCTION_SITES && object.type !== LOOK_STRUCTURES) {
        const constructionSite = room.createConstructionSite(position.x, position.y, STRUCTURE_ROAD);
        if (constructionSite === 0) {
          createdRoads++;
        }
      }
    });
  });
  Memory.positionsVisited = [];
  console.log("created " + createdRoads + " road constructionsites")
}

