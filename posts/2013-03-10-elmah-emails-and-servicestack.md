---
layout: post
title: "Elmah, Emails, and ServiceStack"
date: 2013-03-10 10:00
comments: true
categories:
- development
tags:
- c#
- servicestack
- elmah
---

As you can probably tell, I love [ServiceStack][1]. I also love
[Elmah][2], especially the the email notifications that it provides.

However, the two don't really talk to each other out of the box. Sure,
ServiceStack offers a `ElmahLogFactory` for handling errors and the
like, and that works fine. But that only writes to the configured log.
Emails are nowhere to be found. At least not in my project.

[1]: http://servicestack.net
[2]: https://code.google.com/p/elmah/

<!-- more -->

After doing some digging, I discovered that because all my response
DTOs were marked with `IHasResponseStatus`, ServiceStack was helpfully
catching all my exceptions and serializing them into the
`ResponseStatus` property. But this was all happening inside of
ServiceStack's request life-cycle. And since Elmah's `ErrorMail` setup
is implemented via an `HttpModule`, those exceptions never got a
chance to bubble up to that module. Hence, no emails.

So, how do we get around this? It's quite simple, actually:

```csharp Global.asax.cs
using System;
using System.Reflection;
using System.Web;

using Elmah;

using ServiceStack.ServiceHost;

public class Application : HttpApplication
{
    private AppHost appHost;

    private MailModuleHandler mailHandler;

    private delegate void MailModuleHandler(Exception ex, HttpContext context);

    protected void Application_Start(object sender, EventArgs e)
    {
        // This needs to match what name is set in Web.config
        // under system.web/httpModules, or system.webServer/modules
        var mailModule = (ErrorMailModule)this.Modules["ErrorMail"];
        var onErrorMethod = typeof(ErrorMailModule).GetMethod(
                "OnError",
                BindingFlags.Instance | BindingFlags.NonPublic,
                null,
                new[] { typeof(Exception), typeof(HttpContext) },
                null);

        this.mailHandler = (MailModuleHandler)onErrorMethod.CreateDelegate(
                typeof(MailModuleHandler),
                mailModule);

        this.appHost = new AppHost();
        this.appHost.Init();
        this.appHost.ServiceExceptionHandler = this.HandleServiceException;
    }

    private object HandleServiceException(object request, Exception ex)
    {
        this.mailHandler(ex, HttpContext.Current);
        return DtoUtils.HandleException(this.appHost, request, ex);
    }
}
```
If Elmah had made that `OnError` method public, then this would be
quite trivial actually, but since it's internal, we have to use some
reflection to get our paws on it.

And it really is as simple as that. Elmah will send out emails just
like you're already used to, with the same configuration settings and
filtering and all that good stuff.
