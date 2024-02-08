<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Advanced at.js Integration with ServerState Sample</title>
  <script src="VisitorAPI.js"></script>
  <script>
    Visitor.getInstance("${organizationId}", {serverState: ${visitorState}});
  </script>
  <script>
    window.targetGlobalSettings = { 
      overrideMboxEdgeServer: true,
      serverState: ${serverState}
    };
  </script>
  <style>
    td, th{
      border: #cccccc 1px solid;
      padding: 5px 10px;
    }
  </style>
</head>
<body>
  <h1>Target Server-Side Responses</h1>
  <table>
    <tbody>
      <tr>
        <th> Mbox Name </th>
        <th> Activity Name </th>
        <th> Experience </th>
        <th> Decisioning Method </th>
        <th> Offer Content </th>
        <th> Request ID </th>
      </tr>
      ${tableRows}
    </tbody>
  </table>
  <pre>${content}</pre>
  <script src="AppMeasurement.js"></script>
  <script>var s_code=s.t();if(s_code)document.write(s_code);</script>
</body>
</html>
