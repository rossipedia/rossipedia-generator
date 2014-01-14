---
title: Configuration Matters
date: 2014-01-13 15:00
categories:
- programming
tags:
- c#
- redis
---

Okay, I've figured out what is going on, and it's very subtle. I'm
going to keep Marc's answer as the accepted, as it led me to discover
the issue.

Several factors led to this behavior (as far as I understand it):

* The Redis server's `timeout` setting was set to 0 (which doesn't
  timeout idle connections).
* The `tcp-keepalive` setting was set to 0 (disable TCP keepalive)
* Visual Studio's "Stop Debugging" command (<kbd>Shift+F5</kbd>) is
  absolutely brutal. The whole process is killed (no GC, no cleanup,
  most likely a [TerminateProcess][1] call).

[1]: http://msdn.microsoft.com/en-us/library/windows/desktop/ms686714(v=vs.85).aspx

The combination of both `timeout` and `tcp-keepalive` means that:

* Idle client connections are never killed (`timeout = 0`)
* The server can't detect when a client has disconnected unexpectedly
(`tcp-keepalive = 0`)

Which means that when a client _does_ disconnect unexpectedly (as is
the case via <kbd>Shift+F5</kbd> in Visual Studio), the server
just assumes the client is idle. Since there's no client timeout,


