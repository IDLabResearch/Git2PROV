
[![Build Status](https://travis-ci.org/vladistan/Git2PROV.svg?branch=feature%2Funit-tests)](https://travis-ci.org/vladistan/Git2PROV.svg?branch=feature%2Funit-tests)
[![Coverage Status](https://img.shields.io/coveralls/vladistan/Git2PROV.svg)](https://coveralls.io/r/vladistan/Git2PROV)

#Git2PROV
Check out our [One-minute Git2PROV tutorial on Vimeo](http://vimeo.com/70980809)

For an in-depth description of this tool and its creation, we refer to the following paper:

[Git2PROV: Exposing Version Control System Content as W3C PROV](http://www.iswc2013.semanticweb.org/sites/default/files/iswc_demo_32_0.pdf)
by Tom De Nies, Sara Magliacane, Ruben Verborgh, Sam Coppens, Paul Groth, Erik Mannens, and Rik Van de Walle
Published in 2013 in the Poster and Demo Proceedings of the 12th International Semantic Web Conference.

#Disclaimer and License
Git2PROV is a joint work of [Ghent University](http://www.ugent.be/) - [iMinds](http://www.iminds.be/) - [Multimedia Lab](http://mmlab.be/), and the [Data2Semantics](http://www.data2semantics.org/) project of the [VU University Amsterdam](http://www.vu.nl/) .

The people involved are:
* Tom De Nies (Ghent University - iMinds - MMLab)
* Sara Magliacane (VU Amsterdam)
* Ruben Verborgh (Ghent University - iMinds - MMLab)
* Sam Coppens (Ghent University - iMinds - MMLab)
* Paul Groth (VU Amsterdam)
* Erik Mannens (Ghent University - iMinds - MMLab)
* Rik Van de Walle (Ghent University - iMinds - MMLab)

We chose to make Git2PROV open source under [GPL Version 3 license](http://www.gnu.org/licenses/gpl.html) because we believe this will lead it to its full potential, and be of much more value to the Web community than a single isolated instance running on a server somewhere.

So in short, you are free to use and modify Git2PROV for non-commercial purposes, as long as you make your stuff open source as well and you properly credit us. This is most conveniently done by citing the paper mentioned above.

#Installation

Make sure you have node.js and git installed and in the system PATH variable. Then, run:
```
[sudo] npm install -g git2prov
```

## Converting a repository
To convert a single repository, run:

    git2prov git_url [serialization]

For example:

    git2prov git@github.com:RubenVerborgh/N3.js.git PROV-JSON

## Running the server
To run the server, use the following command:

    git2prov-server [port]

For example:

    git2prov-server 8905

Then go to your browser and enter the following url:
http://localhost:8905/

This will give you the [standard Git2PROV homepage](http://git2prov.org).

TO use the service directly, use the following URL:
http://localhost:8905/git2prov?giturl=<your open git repository>&serialization=<your serialization of choice>&[optional parameters]
The OPTIONAL parameters are:

serialization:
* PROV-N (default)
* PROV-JSON
* PROV-O
* PROV-XML

shortHashes
* true ---> This will force the git log to use short hashes, making the output more readable by humans
  
ignore
* <provenanceRelation> ---> This provenance relation will not appear in the output. Multiple values are possible.
    
Example:
http://localhost:8905/git2prov?giturl=<your open git repository>&serialization=PROV-JSON&shortHashes=true&ignore=wasInformedBy&ignore=used

To start a proxy server:
    node proxy.js <port> <target port>
for example:
    node proxy.js 80 8905

##Running as a service on a Linux/UNIX machine
This script is used in combination with init.d. You could also modify it to work with upstart.

Copy the startup script "git2prov" to your /etc/init.d directory:
```
sudo cp scripts/git2prov /etc/init.d/git2prov
```
Make it executable
```
sudo chmod a+x /etc/init.d/git2prov
```
add it to the startup services
```
update-rc.d git2prov defaults
```
You can now do commands such as
```
sudo service git2prov start
sudo service git2prov restart
sudo service git2prov stop
```

And the service should automatically start when the machine is rebooted.
