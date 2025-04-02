/***************************************************************************************
 * (c) 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 ****************************************************************************************/

const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const TargetClient = require("@adobe/target-nodejs-sdk");
const CONFIG = {
  client: "evolyticsamericaspar",
  organizationId: "48EA40C35A8FFF670A495E61@AdobeOrg",
  timeout: 10000,
  decisioningMethod: "server-side",
  logger: console
};
const targetClient = TargetClient.create(CONFIG);
const TEMPLATE = fs.readFileSync(__dirname + "/templates/index.tpl").toString();

const app = express();
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));

function saveCookie(res, cookie) {
  if (!cookie) {
    return;
  }

  res.cookie(cookie.name, cookie.value, { maxAge: cookie.maxAge * 1000 });
}

const getResponseHeaders = () => ({
  "Content-Type": "text/html",
  Expires: new Date().toUTCString()
});

function sendHtml(res, targetResponse) {
  const serverState = {
    request: targetResponse.request,
    response: targetResponse.response
  };
  let tableRows = []

  targetResponse.response.execute.mboxes.forEach((o)=>{
    let mbox = o.name;
    let activity = "N/A";
    let experience = "N/A";
    let method = targetResponse.meta.decisioningMethod;
    let content = "N/A";
    let requestId = targetResponse.response.requestId

    try{
      if(o.options){
        activity = o.options[0].responseTokens["activity.name"];
        experience = o.options[0].responseTokens["experience.name"];
        content = o.options[0].content;
      }
      //tableRows.push("<tr><td>"+mbox+"</td><td>"+activity+"</td><td>"+experience+"</td><td>"+method+"</td><td><pre>"+JSON.stringify(content, null, " ").replace(/[\\\n\r]/g, "")+"</pre></td><td>"+requestId+"</td></tr>")
    }catch(e){
      console.log("Error:",e)
    }
  })
  const htmlResponse = TEMPLATE.replace(
    "${organizationId}",
    CONFIG.organizationId
  )
    .replace("${visitorState}", JSON.stringify(targetResponse.visitorState))
    .replace("${serverState}", JSON.stringify(serverState, null, " "))
    .replace("${content}", JSON.stringify(targetResponse, null, " "))
    .replace("${tableRows}", JSON.stringify(tableRows.join(""), null, " "));

  res.status(200).send(htmlResponse);
}

function sendSuccessResponse(res, response) {
  res.set(getResponseHeaders());
  saveCookie(res, response.targetCookie);
  saveCookie(res, response.targetLocationHintCookie);
  sendHtml(res, response);
}

function sendErrorResponse(res, error) {
  res.set(getResponseHeaders());
  res.status(500).send(error);
}

function getAddress(req) {
  return { url: req.headers.host + req.originalUrl };
}

// MAKE REQUEST TO TARGET

app.get("/", async (req, res) => {
  const visitorCookie =
    req.cookies[
      encodeURIComponent(
        TargetClient.getVisitorCookieName(CONFIG.organizationId)
      )
    ];
  const targetCookie = req.cookies[TargetClient.TargetCookieName];
  const targetLocationHintCookie =
    req.cookies[TargetClient.TargetLocationHintCookieName];

  // WE CAN PASS MULTIPLE MBOXES IN THE SAME REQUEST
  console.log("VISITOR COOKIE: ", visitorCookie);
  console.log("TARGET COOKIE:",targetCookie);
  console.log("TARGET LOCATION HINT:",targetLocationHintCookie)
  const request = {
    execute: {
      mboxes: [
        {
          address: getAddress(req),
          name: "brock-test-mbox",
          profileParameters: {
            "allianceId": "medi1234"
          }
        },
        {
          address: getAddress(req),
          name: "test-server-mbox"
        }
      ]
    },
    experienceCloud: {
      analytics: {
        logging: "server_side",
        trackingServer: "tmd.sc.omtrdc.net",
      }
    }
  };

  try {
    const response = await targetClient.getOffers({
      request,
      visitorCookie,
      targetCookie,
      targetLocationHintCookie
    });
    sendSuccessResponse(res, response);
  } catch (error) {
    console.error("Target:", error);
    sendErrorResponse(res, error);
  }
});

app.listen(3000, function() {
  console.log("Listening on port 3000 and watching!");
});
