---
title: "Redis: I like you, but you're crazy"
date: 2018-01-23 15:00
categories:
- programming
tags:
- c#
- redis
---

Dear [Redis](http://redis.io),

![I like you, but you're crazy](http://i.imgur.com/fUGHSu1.jpg)

Don't get me wrong, Redis is awesome. We absolutely love it at Stack
Exchange, but it can have some unexpected behavior.

Okay, maybe not totally unexpected, but unexpected to _me_.

The other day I found myself writing a relatively simple testbed for
processing a redis queue (via [Booksleeve][4]). Just a super simple
while loop calling [BLPOP][3] and spitting out the results.

I ran into some... well, "interesting" behavior. And to be completely
honest, it was mainly due to assumptions I had made about how Redis
handles connections.

<!-- more -->

However, the edge case I ran into was most definitely _not_ obvious,
so I figured I'd document it here, partially in the hopes that I can
help somebody out, but mainly just because I know I'm going to forget
this and probably run into it again six months from now.

I wrote up what I was experiencing in a [Stack Overflow question][2].
We'll just go ahead and throw on a... montage!

![We're going to need a montage](http://i.imgur.com/w0KYuVR.jpg)

Okay, good! From a beginner to a pro...

Anyways... back to business. I finally figured out what was going on.

Several factors led to this behavior (as far as I understand it):

###The Redis server's `timeout` setting was set to 0

This means that Redis won't timeout idle connections. "Huh? why would
you ever want that?" Well, it turns out that this is a pretty good
default for Redis (think: PUB/SUB). Sometimes there are clients
connected to redis for days on end with no activity, just waiting for
an event to get published.

###The `tcp-keepalive` setting was set to 0

This is closely tied to above.

* Visual Studio's "Stop Debugging" command (<kbd>Shift+F5</kbd>) is
  absolutely brutal. The whole process is killed (no GC, no cleanup,
  most likely a [TerminateProcess][1] call).


The combination of both `timeout` and `tcp-keepalive` means that:

* Idle client connections are never killed (`timeout = 0`)
* The server can't detect when a client has disconnected unexpectedly
(`tcp-keepalive = 0`)

Which means that when a client _does_ disconnect unexpectedly (as is
the case via <kbd>Shift+F5</kbd> in Visual Studio), the server
just assumes the client is idle. Since there's no client timeout,


[1]: http://msdn.microsoft.com/en-us/library/windows/desktop/ms686714(v=vs.85).aspx
[2]: http://stackoverflow.com/questions/21059099/
[3]: https://code.google.com/p/booksleeve/
[4]: https://code.google.com/p/booksleeve/
[5]: http://www.linqpad.net
