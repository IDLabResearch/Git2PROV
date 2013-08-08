Make sure you have node.js and git installed and in the system PATH variable.

Then you need to run the following commands:
	npm install express
	npm install n3
	npm install http-proxy

===========================
  RUNNING LOCALLY
===========================
To execute, use the following command:
    node index.js [port number, for example 8905]
    
Then go to your browser and enter the following url:
http://localhost:8905/

Otherwise you can use directly the URL:
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


======================================
  RUNNING AS SERVICE ON UNIX MACHINE
======================================

#Copy the startup script to your /etc/init.d directory:
sudo cp git2prov /etc/init.d/git2prov
#Make it executable
sudo chmod a+x /etc/init.d/git2prov
#add it to the startup services
update-rc.d git2prov defaults

#You can now do commands such as
sudo service git2prov start
sudo service git2prov restart
sudo service git2prov stop

#And the service will automatically start when the machine is rebooted.