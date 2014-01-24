---
title: "Redis: I like you, but you're crazy"
date: 2014-01-23 15:00
categories:
- programming
tags:
- c#
- redis
---

Dear [Redis](http://redis.io),

![I like you, but you're crazy](http://i.imgur.com/fUGHSu1.jpg)

<!-- more -->

Don't get me wrong, Redis is awesome. We absolutely love it at Stack
Exchange, but it can have some unexpected behavior.

Okay, maybe not totally unexpected, but unexpected to _me_.

The other day I found myself writing a relatively simple testbed for
processing a redis queue (via [Booksleeve][4]). Just a super simple
while loop calling [BLPOP][3] and spitting out the results.

I ran into some... well, "interesting" behavior. And to be completely
honest, it was mainly due to assumptions I had made about how Redis
handles connections.


However, the edge case I ran into was most definitely _not_ obvious,
so I figured I'd document it here, partially in the hopes that I can
help somebody out, but mainly just because I know I'm going to forget
this and probably run into it again six months from now.

I wrote up what I was experiencing in a [Stack Overflow question][2].
Go ahead and read it. I'll wait.

Done? Great! Anyway, I finally figured out what was going on. A few
factors led to this behavior (as far as I understand it):

**1 - The Redis server's `timeout` setting was set to `0`**

This means that Redis won't timeout idle connections. Huh? "Why would
you want that?" you ask. Well, it turns out that this is a pretty good
default for Redis (think: PUB/SUB). Sometimes there are clients
connected to redis for days on end with no activity, just waiting for
an event to be published.

**2 - The `tcp-keepalive` setting was set to `0`**

This is closely tied to above. The way I understand it, the
`tcp-keepalive` setting tells the OS to periodiacally send a TCP level
"ping" of sorts to the client to detect if it's still connected. Since
this setting was set to zero, this feature was disabled.

And here's the linchpin:

**3 - Visual Studio's "Stop Debugging" command (<kbd>Shift+F5</kbd>) is absolutely brutal.**

The whole process is killed (no GC, no cleanup, most likely a
[TerminateProcess][1] call). The process and anything that the process
is doing is just nuked and the memory reclaimed (any die hard Win32
guys out there feel free to correct me if I'm wrong).

The combination of both `timeout` and `tcp-keepalive` means that:

* Idle client connections are never killed.
* The server can't differentiate between an idle client and a dead
  one.

Which meant that whenever I'd use the "Stop Debugging" command, on the
queue processor, the last `BLPOP` that was issued was _still valid_ as
far as Redis was concerned.

After hitting <kbd>F5</kbd> and <kbd>Shift+F5</kbd> a couple of times,
I basically had quite a sum of queued up `BLPOP` commands from dead
connections, which led to the odd results.

Moral of the story? Understand the configuration and behavior of the
services you depend on, and _don't_ make assumptions.

[1]: http://msdn.microsoft.com/en-us/library/windows/desktop/ms686714(v=vs.85).aspx
[2]: http://stackoverflow.com/questions/21059099/
[3]: https://code.google.com/p/booksleeve/
[4]: https://code.google.com/p/booksleeve/
[5]: http://www.linqpad.net
