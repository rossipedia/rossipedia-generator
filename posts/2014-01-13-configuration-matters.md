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
processing a redis queue, using [BLPOP][3], implemented via
[Booksleeve][4].

<!-- more -->

I encounded some strange behavior (documented [here][2]), and tried to
slim down the app to the bare minimum required to duplicate the
behavior:

```c#
using System;
using System.Text;
using BookSleeve;

static class Program
{
    static void Main()
    {
        using (var redis = new RedisConnection("127.0.0.1"))
        {
            redis.Open();
            while (true)
            {
                // BRPOP the queue
                var t = redis.Lists.BlockingRemoveFirst(0, new[] { "test" }, 0);
                t.Wait();
                var val = Encoding.UTF8.GetString(t.Result.Item2);
                Console.WriteLine("Got: {0}", val);
            }
        }
    }
}
```

Fairly simple. And the message pumping code (executed via [LINQPad][5]):

```c#
using(var redis = new RedisConnection("localhost"))
{
    redis.Open();
    foreach(var i in Enumerable.Range(0, 10))
    {
        // LPUSH
        redis.Lists.AddLast(0, "test", "foo" + i)
            // Call wait to keep things in order
            .Wait();
    }

    Console.WriteLine("queue length: " + redis.Lists.GetLength(0, "test").Result);
}
```

The expected output from the first program was something like this:

```
Got: foo0
Got: foo1
Got: foo2
Got: foo3
Got: foo4
Got: foo5
Got: foo6
Got: foo7
Got: foo8
Got: foo9
queue length: 0
```



Several factors led to this behavior (as far as I understand it):

* The Redis server's `timeout` setting was set to 0 (which doesn't
  timeout idle connections).
* The `tcp-keepalive` setting was set to 0 (disable TCP keepalive)
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
