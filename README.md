Make sure you have node.js and git installed and in the system PATH variable.

To execute, use the following command:
    node index.js
    
Then go to your browser and enter the following url
http://localhost:8905/git2prov?giturl=<your open git repository>&serialization=<your serialization of choice>&options=<options object>
Possible values for serialization:
  PROV-N (default)
  PROV-JSON
  PROV-O
  PROV-XML
Possible values for options object:
  This must always be structured as a JSON object!
  The possible keys are:
    "shortHashes" : true ---> This will force the git log to use short hashes, making the output more readable by humans
    "ignore" : [] ---> This array contains strings of provenance concepts that the user does not want to appear in the output. 
  IMPORTANT: All keys MUST be put between double quotes ("), or an exception will be returned.   
    
Example:
http://localhost:8905/git2prov?giturl=<your open git repository>&serialization=PROV-JSON&options={"shortHashes":true,"ignore":["used","wasDerivedFrom"]}

