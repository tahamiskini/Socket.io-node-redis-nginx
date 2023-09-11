# socketio-nodejs-redis-nginx

# Use docker compose to run all the required services

- docker compose will create socket server instances, redis instace and nginx instance for load balancing

# Please refer ngnix.conf file inside nginx dorectory for nginx configurations

# required commands

    $ docker compose up

# after making changes in files run command to refresh/rebuild images

    $ docker compose up --build

# for connecting to a socket instance url will be

    "http://localhost:8080?userId=< any unique ID >&roomId=< any room Id >"

# also server only accepts "websocket" as socket transport not "polling"

    - need to pass
    {
        "transports":["websocket"]
        }
    while connecting to server using SOCKETIO client

# For monitoring socket server as which clients are connected and what rooms and events are being generated

    - visit "https://admin.socket.io/" and enter server datails
    - select "websocket only ?" button
