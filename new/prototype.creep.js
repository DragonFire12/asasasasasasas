/**
 * Set the unit to idle-mode until recall tick
 *
 * @type {int}
 */
Object.defineProperty(Creep.prototype, "idle", {
    configurable: true,
    get: function () {
        if (this.memory.idle === undefined) return 0;
        if (this.memory.idle <= Game.time) {
            this.idle = undefined;
            return 0;
        }
        return this.memory.idle;
    },
    set: function (val) {
        if (!val && this.memory.idle) {
            delete(this.memory.idle);
        }
        else {
            this.memory.idle = val;
        }
    }
});

/**
 * Set the unit to idle-mode for ticks given
 *
 * @type {int}
 */
Creep.prototype.idleFor = function (ticks = 0) {
    if (ticks > 0) {
        this.idle = Game.time + ticks;
    }
    else {
        this.idle = undefined;
    }
};

Creep.prototype.borderCheck = function () {
    if (this.pos.x === 0 || this.pos.y === 0 || this.pos.x === 49 || this.pos.y === 49) {
        if (this.pos.x === 0 && this.pos.y === 0) {
            this.move(BOTTOM_RIGHT);
        }
        else if (this.pos.x === 0 && this.pos.y === 49) {
            this.move(TOP_RIGHT);
        }
        else if (this.pos.x === 49 && this.pos.y === 0) {
            this.move(BOTTOM_LEFT);
        }
        else if (this.pos.x === 49 && this.pos.y === 49) {
            this.move(TOP_LEFT);
        }
        else if (this.pos.x === 49) {
            if (Math.random() < .33) {
                this.move(LEFT)
            } else if (Math.random() < .33) {
                this.move(TOP_LEFT)
            } else {
                this.move(BOTTOM_LEFT)
            }
        }
        else if (this.pos.x === 0) {
            if (Math.random() < .33) {
                this.move(RIGHT)
            } else if (Math.random() < .33) {
                this.move(TOP_RIGHT)
            } else {
                this.move(BOTTOM_RIGHT)
            }
        }
        else if (this.pos.y === 0) {
            if (Math.random() < .33) {
                this.move(BOTTOM)
            } else if (Math.random() < .33) {
                this.move(BOTTOM_RIGHT)
            } else {
                this.move(BOTTOM_LEFT)
            }
        }
        else if (this.pos.y === 49) {
            if (Math.random() < .33) {
                this.move(TOP)
            } else if (Math.random() < .33) {
                this.move(TOP_RIGHT)
            } else {
                this.move(TOP_LEFT)
            }
        }
        return true;
    }
};

Creep.prototype.renewalCheck = function (level = 8) {
    let renewers = _.filter(Game.creeps, (c) => c.memory.renewing && c.memory.overlord === this.memory.overlord);
    if (Game.rooms[this.memory.overlord].controller && ((this.memory.renewing && Game.rooms[this.memory.overlord].energyAvailable >= 300) || (Game.rooms[this.memory.overlord].controller.level >= level && Game.rooms[this.memory.overlord].energyAvailable >= 300 && this.ticksToLive < 100 && renewers.length < 2))) {
        if (this.ticksToLive >= 1000) {
            this.memory.boostAttempt = undefined;
            this.memory.boosted = undefined;
            return this.memory.renewing = undefined;
        }
        let spawn = this.pos.findClosestByRange(FIND_MY_SPAWNS);
        if (spawn) {
            if (!spawn.spawning) {
                switch (spawn.renewCreep(this)) {
                    case OK:
                        if (this.carry[RESOURCE_ENERGY] > 0 && !spawn.spawning) this.transfer(spawn, RESOURCE_ENERGY);
                        this.say(ICONS.tired);
                        this.memory.renewing = true;
                        return true;
                    case ERR_NOT_IN_RANGE:
                        this.shibMove(spawn);
                        return true;
                }
            }
        }
    }
    this.memory.renewing = undefined;
    return false;
};

Creep.prototype.getSafe = function (hauler = false) {
    if (this.room.memory.responseNeeded) {
        let hub = new RoomPosition(this.room.memory.extensionHub.x, this.room.memory.extensionHub.y, this.room.name);
        if (this.pos.getRangeTo(hub) > 5) {
            this.say(ICONS.withdraw);
            this.shibMove(hub, {range: 4, forceRepath: true});
            return true;
        } else if (!hauler) {
            this.idleFor(10);
        }
        return undefined;
    }
    return undefined;
};

Creep.prototype.tryToBoost = function (boosts) {
    let labs = _.filter(this.room.structures, (s) => s.structureType === STRUCTURE_LAB && !s.memory.active);
    if ((!labs[0] || this.memory.boostAttempt) && !this.memory.boostLab) return this.memory.boostAttempt = true;
    if (!this.memory.requestedBoosts) {
        let available = [];
            for (let key in boosts) {
                let boostInRoom;
                switch (boosts[key]) {
                    case 'attack':
                        boostInRoom = getBoostAmount(this.room, RESOURCE_CATALYZED_UTRIUM_ACID);
                        if (boostInRoom >= 250) {
                            available.push(RESOURCE_CATALYZED_UTRIUM_ACID);
                        }
                        continue;
                    case 'upgrade':
                        boostInRoom = getBoostAmount(this.room, RESOURCE_CATALYZED_GHODIUM_ACID);
                        if (boostInRoom >= 250) {
                            available.push(RESOURCE_CATALYZED_GHODIUM_ACID);
                        }
                        continue;
                    case 'tough':
                        boostInRoom = getBoostAmount(this.room, RESOURCE_CATALYZED_GHODIUM_ALKALIDE);
                        if (boostInRoom >= 250) {
                            available.push(RESOURCE_CATALYZED_GHODIUM_ALKALIDE);
                        }
                        continue;
                    case 'ranged':
                        boostInRoom = getBoostAmount(this.room, RESOURCE_CATALYZED_KEANIUM_ALKALIDE);
                        if (boostInRoom >= 250) {
                            available.push(RESOURCE_CATALYZED_KEANIUM_ALKALIDE);
                        }
                        continue;
                    case 'heal':
                        boostInRoom = getBoostAmount(this.room, RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE);
                        if (boostInRoom >= 250) {
                            available.push(RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE);
                        }
                        continue;
                    case 'dismantle':
                        boostInRoom = getBoostAmount(this, RESOURCE_CATALYZED_ZYNTHIUM_ACID);
                        if (boostInRoom >= 250) {
                            available.push(RESOURCE_CATALYZED_ZYNTHIUM_ACID);
                        }
                }
            }
        this.memory.requestedBoosts = available;
    } else {
        if (this.memory.requestedBoosts.length === 0 || !this.memory.requestedBoosts.length) {
            this.memory.requestedBoosts = undefined;
            return this.memory.boostAttempt = true;
        }
        for (let key in this.memory.requestedBoosts) {
            let boostInRoom = _.sum(this.room.lookForAtArea(LOOK_STRUCTURES, 0, 0, 49, 49, true), (s) => {
                if (s['structure'] && s['structure'].store) {
                    return s['structure'].store[this.memory.requestedBoosts[key]] || 0;
                } else if (s['structure'] && s['structure'].mineralType === this.memory.requestedBoosts[key]) {
                    return s['structure'].mineralAmount || 0;
                } else {
                    return 0;
                }
            });
            if (boostInRoom < 250) {
                this.memory.requestedBoosts.shift();
                let lab = Game.getObjectById(this.memory.boostLab);
                if (lab) {
                    lab.memory.neededBoost = undefined;
                    lab.memory.active = undefined;
                }
                continue;
            }
            if (!this.memory.boostLab) {
                let filledLab = _.filter(this.room.structures, (s) => s.structureType === STRUCTURE_LAB && s.mineralType === this.memory.requestedBoosts[key])[0];
                if (filledLab) {
                    this.memory.boostLab = filledLab.id;
                    filledLab.memory.neededBoost = this.memory.requestedBoosts[key];
                    filledLab.memory.active = true;
                } else {
                    let availableLab = _.filter(this.room.structures, (s) => s.structureType === STRUCTURE_LAB && !s.memory.active)[0];
                    if (availableLab) {
                        this.memory.boostLab = availableLab.id;
                        availableLab.memory.neededBoost = this.memory.requestedBoosts[key];
                        availableLab.memory.active = true;
                    } else {
                        this.memory.requestedBoosts = undefined;
                        return this.memory.boostAttempt = true;
                    }
                }
            }
            let lab = Game.getObjectById(this.memory.boostLab);
            if (lab) {
                switch (lab.boostCreep(this)) {
                    case OK:
                        this.memory.requestedBoosts.shift();
                        lab.memory.neededBoost = undefined;
                        lab.memory.active = undefined;
                        this.say(ICONS.boost);
                        break;
                    case ERR_NOT_IN_RANGE:
                        this.say(ICONS.boost);
                        return this.shibMove(lab);
                    case ERR_NOT_ENOUGH_RESOURCES:
                        this.say(ICONS.boost);
                        return this.shibMove(lab);
                }
            }
        }
    }
};

function getBoostAmount(room, boost) {
    return _.sum(room.lookForAtArea(LOOK_STRUCTURES, 0, 0, 49, 49, true), (s) => {
        if (s['structure'] && s['structure'].store) {
            return s['structure'].store[boost] || 0;
        } else if (s['structure'] && s['structure'].mineralType === boost) {
            return s['structure'].mineralAmount || 0;
        } else {
            return 0;
        }
    });
}

Creep.prototype.repairRoad = function () {
    if (this.carry[RESOURCE_ENERGY] < 10 || this.getActiveBodyparts(WORK) === 0) return;
    let road = _.filter(this.pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax * 0.70)[0];
    if (road) return this.repair(road);
};

Object.defineProperty(Creep.prototype, 'isFull', {
    get: function () {
        if (!this._isFull) {
            this._isFull = _.sum(this.carry) > this.carryCapacity * 0.8;
        }
        return this._isFull;
    },
    enumerable: false,
    configurable: true
});