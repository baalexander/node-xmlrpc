### Testing Overview

The test is meant to simulate a client calling various methods on a remote
system using the node-xmlprc library. Both the client and the remote server are
run as separate node instances.

The test server is called Parameter Server and is meant to set and get
parameters on a server. As this library was originally meant to enable
JavaScript support for the [Robot Operating System](http://www.ros.org/wiki/),
which uses XML-RPC, the test cases reflect a simplified version of interacting
with the ROS [parameter server](http://www.ros.org/wiki/Parameter%20Server).

### How to run 

First start the Parameter Server node (the XML-RPC server):

    node parameter-server.js

Next, start the client:

    node client.js

You should see outputs of the calls on the client's browser or in the console
log.

