const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbpath = path.join(__dirname, 'covid19India.db')
let app = express()
app.use(express.json())

let db = null

const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server has Started')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
  }
}

intializeDBAndServer()

const crateStateResponses = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const crateDistrictDBResponse = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}
//GET States API
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT 
      *
    FROM 
      state;`
  const statesArray = await db.all(getStatesQuery)
  response.send(statesArray.map(eachobject => crateStateResponses(eachobject)))
  //response.send(statesArray)
})

//GET State API
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  SELECT
    *
  FROM
    state
  WHERE
    state_id = ${stateId};`
  const state = await db.get(getStateQuery)
  response.send(crateStateResponses(state))
})

//POST district API
app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const addDistrictQuery = `
            INSERT INTO 
                district(district_name, state_id, cases, cured, active, deaths)
            VALUES
                (
                    '${districtName}',
                     ${stateId},
                     ${cases},
                     ${cured},
                     ${active},
                     ${deaths}
                )
            ;`

  await db.run(addDistrictQuery)
  response.send('District Successfully Added')
})
//GET district API
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  SELECT 
    *
  FROM
    district
  WHERE 
    district_id = '${districtId}';`
  const getDistrict = await db.get(getDistrictQuery)
  response.send(crateDistrictDBResponse(getDistrict))
})

//DELETE district API
app.delete('/districts/:districtId', (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `
  DELETE FROM 
    district
  WHERE 
    district_id = '${districtId}';`
  const deletedQuery = db.run(deleteQuery)
  response.send('District Removed')
})

//UPDATE district API
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrictQuery = `
        UPDATE
            district
        SET
            district_name= '${districtName}',
            state_id= ${stateId},
            cases= ${cases},
            cured= ${cured},
            active= ${active},
            deaths= ${deaths}
        WHERE 
            district_id = ${districtId};`
  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

//GET stats API
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatsQuery = `
          SELECT 
              SUM(cases) AS totalCases,
              SUM(cured) AS totalCured,
              SUM(active) AS totalActive,
              SUM(deaths) AS totalDeaths
          FROM
             district
          WHERE 
             state_id = ${stateId};`
  const statsQuery = await db.get(getStatsQuery)
  response.send(statsQuery)
})

//GET statename API
app.get('/districts/:districtId/details', async (request, response) => {
  const {districtId} = request.params
  const getStateIdQuery = `
  SELECT
    *
  FROM
    district
  WHERE 
    district_id = ${districtId};`
  const district = await db.get(getStateIdQuery)
  const getStateName = `
  SELECT
    state_name AS stateName
  FROM
    state
  WHERE
   state_id = ${district.state_id};`
  const name = await db.get(getStateName)
  response.send(name)
})

module.exports = app
