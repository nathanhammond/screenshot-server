# screenshot-server

This library is the server counterpart to screenshot-client. It listens to requests made from the browser clients it spins up and captures a screenshot. Use this project to bootstrap your testing script.


## Configuration

Each browser on the system should be set up for WebDriver, including installation of necessary plugins.

You should modify the entrypoint of your testing setup to be through this library as it will maintain open WebDriver connections to each browser in which it is currently performing tests.

It is likely that you will want to use multiple devices as part of your process to get full visual test coverage. To have all images end up on the same server, map a local directory to a network resource.


## Methodology

1. On start, open up every available browser on the machine and connect to them using the WebDriver protocol.
2. Once each of the browsers has been launched and is prepared to receive instructions, start an HTTP server.
3. Direct the browser to visit the initial testing page inside of each browser.
4. Listen for requests from the clients.
5. Upon receiving a request, synchronously invoke the WebDriver takeScreenshot method.
6. Write that file to a specified location based upon configuration.
7. Return a 204 once the screenshot has been written, or a 500 if it fails.
