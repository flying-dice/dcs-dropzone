# DCS World Scripting Engine

You are an expert in the DCS World Scripting Engine (Lua-based). Use this reference when writing or reviewing DCS mission scripts, hook scripts, or any Lua code targeting the DCS simulation environment.

## Resources

- `resources/Sim_ControlAPI.md` - Official ED Simulation Control API (hooks, net, export, callbacks)

---

## Environment Overview

- Language: **Lua 5.1** (standard libs: math, table, string, io, os, debug)
- Mission scripts run in an isolated **Mission Scripting Environment**
- Hook scripts load from `$WRITE_DIR/Scripts/Hooks/*.lua` into the GUI Lua state
- Class system uses metatables via `./Scripts/Common/LuaClass.lua`

### Script Execution Methods

| Method | Context |
|--------|---------|
| `DO SCRIPT` / `DO SCRIPT FILE` | Trigger actions |
| `Script` / `Script File` command | AI tasking (waypoint arrival) |
| `CONDITION (LUA EXPRESSION)` | Boolean conditions |
| Initialization script | Runs before first unit spawn and first trigger |

---

## Coordinate System & Units

| Quantity | Unit |
|----------|------|
| Time | seconds |
| Distance | meters |
| Angle | radians (azimuth = CCW around y-axis) |
| Mass | kilograms |

### 3D Cartesian

- **x** = North, **z** = East, **y** = Up
- `Vec3 = {x, y, z}` (3D point/vector)
- `Vec2 = {x, y}` where `Vec2.x = Vec3.x`, `Vec2.y = Vec3.z` (ground plane)

### Position & Orientation

```lua
Position3 = {
  p = Vec3,  -- coordinate
  x = Vec3,  -- front direction (unit vector)
  y = Vec3,  -- top direction (unit vector)
  z = Vec3,  -- right direction (unit vector)
}
Box3 = { min = Vec3, max = Vec3 }
```

### Geographic / MGRS

```lua
-- Lat/Lon: degrees, North & East positive
MGRS = { UTMZone = string, MGRSDigraph = string, Easting = number, Northing = number }
```

### Type System

```lua
TypeName = string          -- e.g. "Su-27", "M2 Bradley"
AttributeName = string     -- from db_attributes.lua
Desc = { typeName = TypeName, displayName = string, attributes = AttributeName[] }
```

---

## Singletons

### env

```lua
env.info(message, showMessageBox?)
env.warning(message, showMessageBox?)
env.error(message, showMessageBox?)
env.setErrorMessageBoxEnabled(on)
```

### timer

```lua
timer.getTime() -> number                     -- model time (seconds)
timer.getAbsTime() -> number                  -- mission time (seconds)
timer.getTime0() -> number                    -- mission start time
timer.scheduleFunction(func, arg, time) -> id -- schedule at model time
timer.setFunctionTime(id, time)               -- reschedule
timer.removeFunction(id)                      -- cancel

-- Scheduled function prototype:
function callback(arg, time) return nextCallTime or nil end
```

### land

```lua
land.SurfaceType = { LAND, SHALLOW_WATER, WATER, ROAD, RUNWAY }

land.isVisible(Vec3 from, Vec3 to) -> bool           -- LOS check (terrain only)
land.getHeight(Vec2 point) -> number                  -- altitude MSL
land.getIP(Vec3 from, Vec3 dir, maxDist) -> Vec3|nil  -- ray-terrain intersection
land.profile(Vec3 from, Vec3 to) -> Vec3[]            -- terrain profile points
land.getSurfaceType(Vec2 point) -> SurfaceType
```

### atmosphere

```lua
atmosphere.getWind(Vec3 point) -> Vec3                  -- wind velocity (no turbulence)
atmosphere.getWindWithTurbulence(Vec3 point) -> Vec3    -- wind velocity (with turbulence)
```

### world

#### Events

```lua
world.event = {
  S_EVENT_SHOT, S_EVENT_HIT, S_EVENT_TAKEOFF, S_EVENT_LAND,
  S_EVENT_CRASH, S_EVENT_EJECTION, S_EVENT_REFUELING, S_EVENT_DEAD,
  S_EVENT_PILOT_DEAD, S_EVENT_BASE_CAPTURED, S_EVENT_MISSION_START,
  S_EVENT_MISSION_END, S_EVENT_TOOK_CONTROL, S_EVENT_REFUELING_STOP,
  S_EVENT_BIRTH, S_EVENT_HUMAN_FAILURE, S_EVENT_ENGINE_STARTUP,
  S_EVENT_ENGINE_SHUTDOWN, S_EVENT_PLAYER_ENTER_UNIT, S_EVENT_PLAYER_LEAVE_UNIT,
  S_EVENT_PLAYER_COMMENT, S_EVENT_SHOOTING_START, S_EVENT_SHOOTING_END,
  S_EVENT_MARK_ADDED, S_EVENT_MARK_CHANGE, S_EVENT_MARK_REMOVED,
  S_EVENT_KILL, S_EVENT_SCORE, S_EVENT_UNIT_LOST,
  S_EVENT_LANDING_AFTER_EJECTION, S_EVENT_PARATROOPER_LENDING,
  S_EVENT_DISCARD_CHAIR_AFTER_EJECTION, S_EVENT_WEAPON_ADD,
  S_EVENT_TRIGGER_ZONE, S_EVENT_LANDING_QUALITY_MARK, S_EVENT_BDA,
  S_EVENT_AI_ABORT_MISSION, S_EVENT_DAYNIGHT, S_EVENT_FLIGHT_TIME,
  S_EVENT_PLAYER_SELF_KILL_PILOT, S_EVENT_PLAYER_CAPTURE_AIRFIELD,
  S_EVENT_EMERGENCY_LANDING
}
```

#### Event Handler

```lua
-- Event table fields: id, time, initiator, target, place, subPlace, weapon
world.addEventHandler(handler)     -- handler must have onEvent(self, event) method
world.removeEventHandler(handler)
```

#### Birth Places

```lua
world.BirthPlace = { wsBirthPlace_Air, wsBirthPlace_RunWay, wsBirthPlace_Park,
                     wsBirthPlace_Heliport_Hot, wsBirthPlace_Heliport_Cold }
```

#### Object Queries

```lua
world.getPlayer() -> Unit
world.getAirbases() -> Airbase[]
```

#### Volume Search

```lua
world.VolumeType = { SEGMENT, BOX, SPHERE, PYRAMID }

world.searchObjects(objectCategory, volume, handler, data)
-- handler(object, data) -> boolean (return true to stop)

-- Volume definitions:
VolumeSegment = { id = world.VolumeType.SEGMENT, params = { from = Vec3, to = Vec3 } }
VolumeBox     = { id = world.VolumeType.BOX,     params = { min = Vec3, max = Vec3 } }
VolumeSphere  = { id = world.VolumeType.SPHERE,  params = { point = Vec3, radius = number } }
VolumePyramid = { id = world.VolumeType.PYRAMID, params = { pos = Position3, length = number, halfAngleHor = number, halfAngleVer = number } }
```

#### Persistence

```lua
world.getPersistenceData(name) -> value|nil
world.setPersistenceHandler(name, handler)
world.setPersistencePassthrough(string[])
```

#### Weather

```lua
world.weather.getFogThickness() -> number
world.weather.setFogThickness(thickness)          -- [100-5000] meters
world.weather.getFogVisibilityDistance() -> number
world.weather.setFogVisibilityDistance(vis)        -- [100-100000] meters
world.weather.setFogAnimation(keyTable)            -- { {time, visibility, thickness}, ... }
```

### coalition

```lua
coalition.side = { NEUTRAL = 0, RED = 1, BLUE = 2 }
coalition.service = { ATC, AWACS, TANKER, FAC }

coalition.getCountryCoalition(countryId) -> side
coalition.getMainRefPoint(side) -> Vec3              -- bullseye
coalition.getRefPoints(side) -> RefPoint[]           -- { callsign, type, point }
coalition.addRefPoint(side, RefPoint)
coalition.getServiceProviders(side, serviceId) -> Unit[]
coalition.getPlayers(side) -> Unit[]
coalition.getAirbases(side) -> Airbase[]
coalition.getGroups(side, groupCategory?) -> Group[]
coalition.getStaticObjects(side) -> StaticObject[]
coalition.addGroup(countryId, groupCategory, groupData) -> Group
coalition.addStaticObject(countryId, staticData) -> StaticObject
```

### country

```lua
country.id = {
  RUSSIA, UKRAINE, USA, TURKEY, UK, FRANCE, GERMANY, CANADA,
  SPAIN, THE_NETHERLANDS, BELGIUM, NORWAY, DENMARK, ISRAEL,
  GEORGIA, INSURGENTS, ABKHAZIA, SOUTH_OSETIA, ITALY
}
```

### trigger

```lua
trigger.smokeColor = { Green, Red, White, Orange, Blue }
trigger.flareColor = { Green, Red, White, Yellow }

-- Flags & Zones
trigger.misc.getUserFlag(name) -> number
trigger.misc.getZone(name) -> { point = Vec3, radius = number }
trigger.action.setUserFlag(name, value)

-- Output
trigger.action.outText(text, duration)
trigger.action.outTextForCoalition(side, text, duration)
trigger.action.outTextForCountry(countryId, text, duration)
trigger.action.outTextForGroup(groupId, text, duration)
trigger.action.outSound(soundFile)
trigger.action.outSoundForCoalition(side, soundFile)
trigger.action.outSoundForCountry(countryId, soundFile)
trigger.action.outSoundForGroup(groupId, soundFile)

-- Effects
trigger.action.explosion(Vec3, power)
trigger.action.smoke(Vec3, smokeColor)
trigger.action.illuminationBomb(Vec3)
trigger.action.signalFlare(Vec3, flareColor, azimuth)

-- Radio
trigger.action.radioTransmission(fileName, Vec3, modulation, loop, frequency, power)

-- Group Control
trigger.action.setAITask(group, taskIndex)
trigger.action.pushAITask(group, taskIndex)
trigger.action.activateGroup(group)
trigger.action.deactivateGroup(group)
trigger.action.setGroupAIOn(group)
trigger.action.setGroupAIOff(group)
trigger.action.groupStopMoving(group)
trigger.action.groupContinueMoving(group)

-- F10 Menu Commands
trigger.action.addOtherCommand(name, flagName, flagValue?)
trigger.action.removeOtherCommand(name)
trigger.action.addOtherCommandForCoalition(side, name, flagName, flagValue?)
trigger.action.removeOtherCommandForCoalition(side, name)
trigger.action.addOtherCommandForGroup(groupId, name, flagName, flagValue?)
trigger.action.removeOtherCommandForGroup(groupId, name)

-- Custom Events
trigger.action.userEvent(...)
```

### coord

```lua
coord.LLtoLO(lat, lon, alt?) -> Vec3
coord.LOtoLL(Vec3) -> lat, lon, alt
coord.LLtoMGRS(lat, lon) -> MGRS
coord.MGRStoLL(MGRS) -> lat, lon
```

### radio

```lua
radio.modulation = { AM, FM }
```

### missionCommands

```lua
-- Returns Path (opaque type, do not construct manually)
missionCommands.addCommand(name, path?, func, arg) -> Path
missionCommands.addSubMenu(name, path?) -> Path
missionCommands.removeItem(path?)

-- Coalition variants
missionCommands.addCommandForCoalition(side, name, path?, func, arg) -> Path
missionCommands.addSubMenuForCoalition(side, name, path?) -> Path
missionCommands.removeItemForCoalition(side, path?)

-- Group variants
missionCommands.addCommandForGroup(groupId, name, path?, func, arg) -> Path
missionCommands.addSubMenuForGroup(groupId, name, path?) -> Path
missionCommands.removeItemForGroup(groupId, path?)
```

### AI Constants

```lua
AI.Skill = { AVERAGE, GOOD, HIGH, EXCELLENT, PLAYER, CLIENT }
AI.Task.WeaponExpend = { ONE, TWO, FOUR, QUARTER, HALF, ALL }
AI.Task.OrbitPattern = { CIRCLE, RACE_TRACK }
AI.Task.Designation = { NO, AUTO, WP, IR_POINTER, LASER }
AI.Task.WaypointType = { TAKEOFF, TAKEOFF_PARKING, TURNING_POINT, LAND }
AI.Task.TurnMethod = { FLY_OVER_POINT, FIN_POINT }
AI.Task.AltitudeType = { BARO, RADIO }
AI.Task.VehicleFormation = { OFF_ROAD, ON_ROAD, RANK, CONE, DIAMOND, VEE, ECHELON_LEFT, ECHELON_RIGHT }

-- Behavior option namespaces
AI.Option.Air.id    -- ROE, REACTION_ON_THREAT, RADAR_USING, FLARE_USING, FORMATION, RTB_ON_BINGO, SILENCE
AI.Option.Ground.id -- ROE, DISPERSE_ON_ATTACK, ALARM_STATE
AI.Option.Naval.id  -- ROE
```

---

## Class Hierarchy

```
Object
├── CoalitionObject
│   ├── Unit (final)
│   ├── Weapon (final)
│   ├── StaticObject (final)
│   └── Airbase (final)
├── SceneryObject (final)
Group (standalone)
Controller (standalone)
Spot (standalone)
```

### Object (base class)

```lua
Object.Category = { UNIT, WEAPON, STATIC, SCENERY, BASE }

object:isExist() -> bool
object:destroy()                    -- removes without damage/events
object:getCategory() -> Category
object:getTypeName() -> TypeName
object:getDesc() -> Object.Desc    -- { life, box, typeName, displayName, attributes }
object:hasAttribute(attrName) -> bool
object:getName() -> string          -- ME-assigned name
object:getPoint() -> Vec3
object:getPosition() -> Position3
object:getVelocity() -> Vec3
object:inAir() -> bool
```

### CoalitionObject (extends Object)

```lua
coalObj:getCoalition() -> coalition.side
coalObj:getCountry() -> country.id
```

### Unit (extends CoalitionObject, final)

```lua
Unit.Category = { AIRPLANE, HELICOPTER, GROUND_UNIT, SHIP, STRUCTURE }
Unit.RefuelingSystem = { BOOM_AND_RECEPTACLE, PROBE_AND_DROGUE }
Unit.SensorType = { OPTIC, RADAR, IRST, RWR }
Unit.OpticType = { TV, LLTV, IR }
Unit.RadarType = { AS, SS }

-- Static
Unit.getByName(name) -> Unit|nil

-- Members
unit:isActive() -> bool
unit:getPlayerName() -> string|nil
unit:getID() -> UnitID
unit:getNumber() -> number          -- position in group
unit:getController() -> Controller|nil
unit:getGroup() -> Group|nil
unit:getCallsign() -> string
unit:getLife() -> number            -- <= 1.0 when dead
unit:getLife0() -> number           -- initial health
unit:getFuel() -> number            -- 0.0-1.0 (>1.0 with external tanks)
unit:getAmmo() -> AmmoItem[]       -- { desc = Weapon.Desc, count = number }
unit:getSensors() -> table
unit:hasSensors(sensorType, ...) -> bool
unit:getRadar() -> bool, Object     -- radar on, tracked target
unit:getDesc() -> Unit.Desc
```

#### Unit Descriptors

```lua
Unit.Desc         = { category, massEmpty, speedMax }
Unit.DescAircraft = Unit.Desc + { fuelMassMax, range, Hmax, VyMax, NyMin, NyMax, tankerType }
Unit.DescAirplane = Unit.DescAircraft + { speedMax0, speedMax10K }
Unit.DescHelicopter = Unit.DescAircraft + { HmaxStat }
Unit.DescVehicle  = Unit.Desc + { maxSlopeAngle, riverCrossing }
Unit.DescShip     = Unit.Desc  -- no additional fields
```

### Weapon (extends CoalitionObject, final)

```lua
Weapon.Category = { SHELL, MISSILE, ROCKET, BOMB }
Weapon.GuidanceType = { INS, IR, RADAR_ACTIVE, RADAR_SEMI_ACTIVE, RADAR_PASSIVE, TV, LASER, TELE }
Weapon.MissileCategory = { AAM, SAM, BM, ANTI_SHIP, CRUISE, OTHER }
Weapon.WarheadType = { AP, HE, SHAPED_EXPLOSIVE }

-- Weapon.flag: LGB, TvGB, SNSGB, HEBomb, Penetrator, NapalmBomb, FAEBomb, ClusterBomb,
--   Dispencer, CandleBomb, ParachuteBomb, GuidedBomb, AnyUnguidedBomb, AnyBomb,
--   LightRocket, MarkerRocket, CandleRocket, HeavyRocket, AnyRocket,
--   AntiRadarMissile, AntiShipMissile, AntiTankMissile, FireAndForgetASM,
--   LaserASM, TeleASM, CruiseMissile,
--   SRAAM, MRAAM, LRAAM, IR_AAM, SAR_AAM, AR_AAM,
--   GUN_POD, BuiltInCannon,
--   AnyAGWeapon, AnyAAWeapon, UnguidedWeapon, GuidedWeapon, AnyWeapon, MarkerWeapon, ArmWeapon

weapon:getLauncher() -> Unit
weapon:getTarget() -> Object|nil
weapon:getDesc() -> Weapon.Desc
```

### StaticObject (extends CoalitionObject, final)

```lua
StaticObject.getByName(name) -> StaticObject|nil

staticObj:getID() -> StaticObjectID
staticObj:getDesc() -> StaticObject.Desc  -- same as Unit.Desc
```

### Airbase (extends CoalitionObject, final)

```lua
Airbase.Category = { AIRDROME, HELIPAD, SHIP }

Airbase.getByName(name) -> Airbase|nil
Airbase.getDescByName(typeName) -> Airbase.Desc|nil

airbase:getUnit() -> Unit              -- only works for ships
airbase:getID() -> AirbaseID
airbase:getCallsign() -> string
airbase:getDesc() -> Airbase.Desc     -- { category }
```

### SceneryObject (extends Object, final)

No additional methods. `SceneryObject.Desc = Unit.Desc`.

### Group

```lua
Group.Category = { AIRPLANE, HELICOPTER, GROUND, SHIP }

Group.getByName(name) -> Group|nil

group:isExist() -> bool
group:destroy()                       -- destroys group and all units
group:getCategory() -> Group.Category
group:getCoalition() -> coalition.side
group:getName() -> string
group:getID() -> GroupID
group:getUnit(unitNumber) -> Unit|nil
group:getSize() -> number            -- initial size (unchanged by losses)
group:getUnits() -> Unit[]           -- currently alive units
group:getController() -> Controller
```

### Controller

```lua
-- Task management
controller:setTask(task)
controller:resetTask()
controller:pushTask(task)
controller:popTask()
controller:hasTask() -> bool

-- Control
controller:setOnOff(bool)            -- ground/naval only
controller:setCommand(command)
controller:setOption(optionId, optionValue)
```

#### Main Tasks (Airborne)

```lua
-- NoTask: { id = 'NoTask', params = {} }
-- AttackGroup: { id = 'AttackGroup', params = { groupId, weaponType?, expend?, attackQty?, directionEnabled?, direction?, altitudeEnabled?, altitude?, attackQtyLimit? } }
-- AttackUnit: { id = 'AttackUnit', params = { unitId, weaponType?, expend?, attackQty?, direction?, attackQtyLimit?, groupAttack? } }
-- Bombing: { id = 'Bombing', params = { point, weaponType?, expend?, attackQty?, direction?, groupAttack? } }
-- AttackMapObject: { id = 'AttackMapObject', params = { point, weaponType?, expend?, attackQty?, direction?, groupAttack? } }
-- BombingRunway: { id = 'BombingRunway', params = { runwayId, weaponType?, expend?, attackQty?, direction?, groupAttack? } }
-- Orbit: { id = 'Orbit', params = { pattern, point, point2?, speed, altitude } }
-- Refueling: { id = 'Refueling', params = {} }
-- Land: { id = 'Land', params = { point, durationFlag?, duration? } }  -- helicopters only
-- Follow: { id = 'Follow', params = { groupId, pos, lastWptIndexFlag?, lastWptIndex? } }
-- Escort: { id = 'Escort', params = { groupId, pos, lastWptIndexFlag?, lastWptIndex?, engagementDistMax?, targetTypes? } }
-- FAC_AttackGroup: { id = 'FAC_AttackGroup', params = { groupId, weaponType?, designation?, datalink? } }
-- Mission: { id = 'Mission', params = { route = { points = waypoint[] } } }
```

#### Main Tasks (Ground)

```lua
-- FireAtPoint: { id = 'FireAtPoint', params = { point, radius? } }
-- Hold: { id = 'Hold', params = {} }
-- Mission: { id = 'Mission', params = { route = { points = waypoint[] } } }
```

#### Enroute Tasks (Airborne)

```lua
-- EngageTargets: { id = 'EngageTargets', params = { maxDist?, targetTypes?, priority? } }
-- EngageTargetsInZone: { id = 'EngageTargetsInZone', params = { point, zoneRadius, targetTypes?, priority? } }
-- EngageGroup: { id = 'EngageGroup', params = { groupId, weaponType?, expend?, attackQty?, direction?, attackQtyLimit?, priority? } }
-- EngageUnit: { id = 'EngageUnit', params = { unitId, weaponType?, expend?, attackQty?, direction?, attackQtyLimit?, groupAttack?, priority? } }
-- AWACS: { id = 'AWACS', params = {} }
-- Tanker: { id = 'Tanker', params = {} }
```

#### Enroute Tasks (Ground)

```lua
-- EWR: { id = 'EWR', params = {} }
```

#### Enroute Tasks (Airborne & Ground)

```lua
-- FAC_EngageGroup: { id = 'FAC_EngageGroup', params = { groupId, weaponType?, designation?, datalink?, priority? } }
-- FAC: { id = 'FAC', params = { radius?, priority? } }
```

#### Special Tasks

```lua
-- ControlledTask: { id = 'ControlledTask', params = { task, stopCondition = { time?, userFlag?, userFlagValue?, condition?, duration?, lastWaypoint? } } }
-- ComboTask: { id = 'ComboTask', params = { tasks = task[] } }
-- WrappedAction: { id = 'WrappedAction', params = { action = Command } }
```

#### Commands

```lua
-- { id = 'Script', params = { command = "lua code string" } }
-- { id = 'SetCallsign', params = { callname, number } }
-- { id = 'SetFrequency', params = { frequency, modulation } }
-- { id = 'SwitchWaypoint', params = { fromWaypointIndex, goToWaypointIndex } }
-- { id = 'StopRoute', params = { value = bool } }
-- { id = 'SwitchAction', params = { actionIndex } }
-- { id = 'SetInvisible', params = { value = bool } }
-- { id = 'SetImmortal', params = { value = bool } }
-- { id = 'ActivateBeacon', params = { type, system, name, callsign, frequency } }
-- { id = 'DeactivateBeacon', params = {} }
-- { id = 'EPLRS', params = { value = bool, groupId? } }
```

#### Behavior Options

```lua
-- Air ROE values
AI.Option.Air.val.ROE = { WEAPON_FREE, OPEN_FIRE_WEAPON_FREE, OPEN_FIRE, RETURN_FIRE, WEAPON_HOLD }
AI.Option.Air.val.REACTION_ON_THREAT = { NO_REACTION, PASSIVE_DEFENCE, EVADE_FIRE, BYPASS_AND_ESCAPE, ALLOW_ABORT_MISSION }
AI.Option.Air.val.RADAR_USING = { NEVER, FOR_ATTACK_ONLY, FOR_SEARCH_IF_REQUIRED, FOR_CONTINUOUS_SEARCH }
AI.Option.Air.val.FLARE_USING = { NEVER, AGAINST_FIRED_MISSILE, WHEN_FLYING_IN_SAM_WEZ, WHEN_FLYING_NEAR_ENEMIES }
-- RTB_ON_BINGO: bool
-- SILENCE: bool
-- FORMATION: 4-byte encoded value (2 bytes type + 1 byte orientation + 1 byte variant)

-- Formation types: NO_FORMATION, LINE_ABREAST, TRAIL, WEDGE, ECHELON_RIGHT, ECHELON_LEFT,
--   FINGER_FOUR, SPREAD_FOUR, HEL_WEDGE, HEL_ECHELON, HEL_FRONT, HEL_COLUMN

-- Ground ROE values
AI.Option.Ground.val.ROE = { OPEN_FIRE, RETURN_FIRE, WEAPON_HOLD }
AI.Option.Ground.val.ALARM_STATE = { AUTO, GREEN, RED }
-- DISPERSE_ON_ATTACK: bool

-- Naval ROE values
AI.Option.Naval.val.ROE = { OPEN_FIRE, RETURN_FIRE, WEAPON_HOLD }
```

### Detection

```lua
Controller.Detection = { VISUAL, OPTIC, RADAR, IRST, RWR, DLINK }

controller:isTargetDetected(object, detection1?, ...) -> detected, visible, type, distance, lastTime, lastPos, lastVel
controller:getDetectedTargets(detection1?, ...) -> DetectedTarget[]
-- DetectedTarget = { object, visible, type, distance }
controller:knowTarget(object, type, distance)
```

### Spot

```lua
Spot.Category = { INFRA_RED, LASER }

Spot.createInfraRed(source, localPoint?, point) -> Spot
Spot.createLaser(source, localPoint?, point, laserCode) -> Spot

spot:destroy()
spot:getCategory() -> Spot.Category
spot:getPoint() -> Vec3
spot:getCode() -> number
spot:setPoint(Vec3)
spot:setCode(number)
```

---

## Sim Control API (Hooks)

Hook scripts go in `$WRITE_DIR/Scripts/Hooks/*.lua`. They share access to `Sim.*`, `net.*`, `log.*`, `Export.*` tables. See `resources/Sim_ControlAPI.md` for the full reference including:

- **Sim.\*** - Pause, stop, mission info, unit properties, config
- **net.\*** - Player management, chat, kick/ban, mission list, JSON conversion
- **log.\*** - Structured logging with subsystem and level filtering
- **Export.Lo\*** - Telemetry export (ownship, sensors, world objects)
- **Callbacks** - `onMissionLoadBegin/End`, `onSimulationStart/Stop/Frame/Pause/Resume`, `onGameEvent`, `onPlayerConnect/Disconnect/Start/Stop/ChangeSlot`, `onPlayerTryConnect/TrySendChat/TryChangeSlot`, GUI callbacks

### Key Callback Signatures

```lua
function onPlayerTryConnect(addr, name, ucid, playerID) -> true | false, reason end
function onPlayerTrySendChat(playerID, msg, to) -> filteredMsg | "" end
function onPlayerTryChangeSlot(playerID, side, slotID) -> true | false end
function onGameEvent(eventName, arg1, arg2, arg3, arg4) end
-- Events: "friendly_fire", "mission_end", "kill", "self_kill", "change_slot",
--         "connect", "disconnect", "crash", "eject", "takeoff", "landing", "pilot_death"
```

---

## Common Patterns

### Event Handler

```lua
local handler = {}
function handler:onEvent(event)
  if event.id == world.event.S_EVENT_BIRTH then
    local unit = event.initiator
    env.info("Unit born: " .. unit:getName())
  end
end
world.addEventHandler(handler)
```

### Scheduled Function

```lua
local function checkCondition(arg, time)
  -- do work
  return timer.getTime() + 10  -- call again in 10 seconds
end
timer.scheduleFunction(checkCondition, nil, timer.getTime() + 1)
```

### Spawn Group

```lua
local groupData = {
  name = "New Group",
  task = "Ground Nothing",
  units = {
    [1] = {
      name = "New Unit",
      type = "M-1 Abrams",
      x = 100000,
      y = 200000,
      heading = 0,
    }
  },
  route = { points = {} },
}
coalition.addGroup(country.id.USA, Group.Category.GROUND, groupData)
```

### F10 Menu Command

```lua
local subMenu = missionCommands.addSubMenuForCoalition(coalition.side.BLUE, "My Scripts")
missionCommands.addCommandForCoalition(coalition.side.BLUE, "Do Thing", subMenu, function()
  trigger.action.outTextForCoalition(coalition.side.BLUE, "Thing done!", 10)
end, nil)
```
