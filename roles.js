module.exports = {
  HARVESTER: "harvest",
  CONTROLLER_UPGRADER: "supplyController",
  BUILDER: "build",
  REPAIR: "repair",
  CLAIM: "claim",
  harvest: function (creep) {
    setHarvestingMemory(creep);

    if (creep.memory.harvesting) {
      harvestEnergyFromNearestSource(creep);

    } else {
      const structures = creep.room.find(FIND_MY_STRUCTURES, {
        filter: function (object) {
          return object.energy < object.energyCapacity && (object.structureType === STRUCTURE_SPAWN || object.structureType === STRUCTURE_EXTENSION);
        }
      }).sort((a, b) => b.energyCapacity - a.energyCapacity);

      const sortedStructersByDistance = _.sortBy(structures, s => creep.pos.getRangeTo(s));

      executeActionOrGoThereFirst(creep, sortedStructersByDistance[0], target => creep.transfer(target, RESOURCE_ENERGY));
    }
  },

  supplyController: function (creep) {
    setHarvestingMemory(creep);

    if (creep.memory.harvesting) {
      harvestEnergyFromNearestSource(creep);

    } else {
      const controller = creep.room.controller;
      executeActionOrGoThereFirst(creep, controller, (action) => creep.upgradeController(action));
    }
  },
  repair: function (creep) {
    setHarvestingMemory(creep);

    if (creep.memory.harvesting) {
      harvestEnergyFromNearestSource(creep);

    } else {

      const repairTargets = creep.room.find(FIND_STRUCTURES, {filter: s => s.hits < s.hitsMax}).sort((a, b) => a.hits - b.hits);
      if (repairTargets.length) {
        executeActionOrGoThereFirst(creep, repairTargets[0], target => creep.repair(target));
      }
    }
  },

  build: function (creep) {
    setHarvestingMemory(creep);

    if (creep.memory.harvesting) {
      harvestEnergyFromNearestSource(creep);

    } else {
      const constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);

      executeActionOrGoThereFirst(creep, constructionSite, target => creep.build(target));
    }
  },
  claim: function (creep) {
    const flag = Game.flags.filter(flag => flag.color === COLOR_RED)[0];

    const exitDirection = creep.findExit(creep.room, flag.room);
    const exit = creep.pos.findClosestByRange(exitDirection);

    if (creep.room.name !== flag.room.name) {
      creep.moveTo(exit);
    } else {
      const claimResult = creep.claimController(creep.room.controller);

      if (claimResult === ERR_NOT_IN_RANGE) {
        // move towards the controller
        creep.moveTo(creep.room.controller);
      } else if (claimResult === ERR_GCL_NOT_ENOUGH) {
        creep.say('NO GCL->reserving');
        let reserveResult = creep.reserveController(creep.room.controller);
        if (reserveResult !== 0) {
          console.log('Claimer reserving error: ' + reserveResult);
          creep.moveTo(creep.room.controller);
        }
      } else if (claimResult !== 0) {
        console.log('Claimer error: ' + claimResult);
      } else if (claimResult === 0) {
        const energySource = creep.room.find(FIND_SOURCES_ACTIVE);

        let spawnPosition = {
          x: energySource.x + 2,
          y: energySource.y + 2
        };

        const range = 20;

        while (creep.room.createConstructionSite(spawnPosition.x, spawnPosition.y, STRUCTURE_SPAWN) !== 0) {
          spawnPosition.x = Math.floor(Math.random() * range) - range / 2;
          spawnPosition.y = Math.floor(Math.random() * range) - range / 2;
        }

      }
    }
  }
};

let harvestEnergyFromNearestSource = function (creep) {
  const energySourceFromMemory = Game.getObjectById(creep.memory.energySourceId);
  const energySource = energySourceFromMemory ? energySourceFromMemory : creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

  if (energySource) {
    executeActionOrGoThereFirst(creep, energySource, energySource => creep.harvest(energySource));
    creep.memory.energySourceId = energySource.id;
  }
};

let setHarvestingMemory = function (creep) {
  const storageIsFull = creep.carry.energy === creep.carryCapacity;
  const storageIsEmpty = creep.carry.energy === 0;

  if (storageIsFull && creep.memory.harvesting) {
    creep.say(creep.memory.role);
    creep.memory.harvesting = false;
  }

  if (storageIsEmpty && !creep.memory.harvesting) {
    creep.say("get energy");
    creep.memory.harvesting = true;
    creep.memory.energySourceId = null;
  }
};

let executeActionOrGoThereFirst = function (creep, target, action) {

  const isNotInRange = action(target) === ERR_NOT_IN_RANGE;

  if (isNotInRange) {
    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
  }
};

