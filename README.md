Make sure you have node.js and git installed and in the system PATH variable.

To execute, use the following command:
    node index.js
    
Then go to your browser and enter the following url
http://localhost:8905/git2prov?giturl=<your open git repository>&serialization=<your serialization of choice>&[optional parameters]
The OPTIONAL parameters are:
serialization:
  PROV-N (default)
  PROV-JSON
  PROV-O
  PROV-XML
shortHashes
  true ---> This will force the git log to use short hashes, making the output more readable by humans
ignore
  <provenanceRelation> ---> This provenance relation will not appear in the output. Multiple values are possible.
    
Example:
http://localhost:8905/git2prov?giturl=<your open git repository>&serialization=PROV-JSON&shortHashes=true&ignore=wasInformedBy&ignore=used

