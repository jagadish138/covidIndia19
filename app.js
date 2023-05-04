const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const jwt = require("jsonwebtoken");
app.use(express.json());
const bcrypt = require("bcrypt");

const dbpath = path.join(__dirname, "covid19IndiaPortal.db");
let covidData = null;
const initailizeDateAndServer = async () => {
  try {
    covidData = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost/3000");
    });
  } catch (e) {
    console.log(`db error:${e.message}`);
    process.exit(1);
  }
};
initailizeDateAndServer();

function authentication(request, response, next) {
  const athenHeader = request.headers["authorization"];
  let jwtToken;
  if (athenHeader !== undefined) {
    jwtToken = athenHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "the_key_my", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid jwtToken");
      } else {
        next();
      }
    });
  }
}

const displayAllstates = (eachstate) => {
  return {
    stateId: eachstate.state_id,
    stateName: eachstate.state_name,
    population: eachstate.population,
  };
};

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const registeredUserDetails = `
    SELECT*
    FROM user
    WHERE
    username='${username}';
    `;

  const perticularUserdetail = await covidData.get(registeredUserDetails);
  const passcheck = await bcrypt.compare(
    password,
    perticularUserdetail.password
  );
  if (perticularUserdetail === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    if (passcheck) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "the_key_my");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send(" Invalid password");
    }
  }
});

app.get("/states/", authentication, async (request, response) => {
  const allStates = `
    SELECT*
    FROM state

    `;
  const displayStates = await covidData.all(allStates);
  response.send(displayStates);
});

app.get("/states/:stateId/", authentication, async (request, response) => {
  const { stateId } = request.params;
  const allStates = `
    SELECT*
    FROM state
    WHERE 
    state_id='${stateId}'

    `;
  const displayState = await covidData.get(allStates);
  response.send(displayState);
});

app.get(
  "/districts/:districtId/",
  authentication,
  async (request, response) => {
    const { districtId } = request.params;
    const allDistrict = `
    SELECT*
    FROM district
    WHERE 
    district_id='${districtId}';
 `;
    const displayDistrict = await covidData.get(allDistrict);
    response.send(displayDistrict);
  }
);

app.post("/districts/", authentication, async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrict = `
     INSERT INTO district
     (district_name,state_id,cases,cured,active,deaths)
     VALUES(
         '${districtName}',
         '${stateId}',
         '${cases}',
         '${cured}',
         '${active}',
         '${deaths}'
     );
    `;
  const addingDist = await covidData.run(addDistrict);
  response.send("District Successfully Added");
});

app.delete(
  "/districts/:districtId/",
  authentication,
  async (request, response) => {
    const { districtId } = request.params;
    const deleteDist = `
     DELETE* 
     FROM district
     WHERE
      district_id='${districtId}';
     `;
    const districtDistrict = await covidData.run(deleteDist);
    response.send("District Removed");
  }
);

app.put(
  "/districts/:districtId/",
  authentication,
  async (request, response) => {
    const { districtId } = request.params;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const changeDistrict = `
    UPDATE district
   SET 
  district_name='${districtName}',
  state_id='${stateId}',
  cases= '${cases}',
  cured='${cured}',
  active='${active}',
  deaths='${deaths}'

    WHERE 
    district_id='${districtId}';
 `;
    const disDistrict = await covidData.get(changeDistrict);
    response.send(disDistrict);
  }
);

app.get(
  "/states/:stateId/stats/",
  authentication,
  async (request, response) => {
    const { stateId } = request.params;
    const result = `
    SELECT
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths,
    FROM district
    WHERE
    state_id='${stateId}'
    `;
    const showRes = await covidData.get(result);
    response.send({
      totalCases: stats["totalCases"],
      totalCured: stats["totalCured"],
      totalActive: stats["totalActive"],
      totalDeaths: stats["totalDeaths"],
    });
  }
);
module.exports = app;
