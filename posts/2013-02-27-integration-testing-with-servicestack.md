---
author: Bryan J. Ross
layout: post
title: "Integration Testing with ServiceStack"
comments: true
categories: development
date: 2013-02-27 22:31
tags:
- servicestack
- c#
- programming
---

I'm doing a lot of [ServiceStack][1] development these days, and
loving every minute of it.

One of the things I wanted with my integration tests was a controlled
environment. I wanted to be able to set the connection string for the
test database, and run full-stack tests on my services using
[NUnit][2] via [ReSharper][3]'s test runner. However, I also wanted to
be able to step through (F11) seamlessly from a given test case to the
service code without missing a beat. Since my services were configured
to run under ASP.NET/IIS, that last part required some thought.

<!-- more -->

To get this all to work was actually pretty simple. The trick lies in
getting a Self-hosted AppHost to get set up using the same code as the
ASP.NET-based AppHost. Since ServiceStack requires an
inheritance-based approach (you derive from either `AppHostBase` or
`AppHostHttpListenerBase`, which happen to be completely unrelated
except they both implement `IAppHost`, which isn't quite suitable for
our purposes), I went with static methods.

*NOTE*: As pointed out by [Wayne Brantley][4], this approach requires
Visual Studio to be run as Administrator, as opening a port requires
elevated privileges.

First, set up the AppHosts:

```csharp
// The ASP.NET/IIS app host
public class WebAppHost : AppHostBase
{
  private readonly string connString;

  public WebAppHost()
    : this(AppSettings.ConnectionString)
  {
  }

  public WebAppHost(string connString)
    : base("My Service", typeof(WebAppHost).Assembly)
  {
    this.connString = connString;
  }

  public override void Configure(Container container)
  {
    AppHostCommon.Init(container, this.connString);
    this.SetConfig(AppHostCommon.GetConfig());
    this.Plugins.AddRange(AppHostCommon.GetPlugins());
  }
}

// The Self-Host AppHost
public class SelfAppHost : AppHostHttpListenerBase
{
  public SelfAppHost()
    : this(AppSettings.ConnectionString)
  {
  }

  public SelfAppHost(string connString)
    : base("My Service", typeof(WebAppHost).Assembly)
  {
    this.connString = connString;
  }

  public override void Configure(Container container)
  {
    AppHostCommon.Init(container, this.connString);
    this.SetConfig(AppHostCommon.GetConfig());
    this.Plugins.AddRange(AppHostCommon.GetPlugins());
  }
}
```

You'll notice that except for the names of the these classes, and the
specific base-classes, the code is exactly the same for each one. This
is due to the fact that AppHostBase and AppHostHttpListenerBase handle
completely separate problem domains, and are technically completely
different classes (event though they look the same and fill similar
roles).

And for the AppHostCommon class:

```csharp
public static class AppHostCommon
{
  public static void Init(Container container, string connString)
  {
    container.Register<IDbConnectionFactory>(c => new OrmLiteDbConnectionFactory(
         connectionString:  connString,
         autoDisposeConnection: true,
         dialectProvider: OrmLiteConfig.DialectProvider));
  }

  public static EndpointHostConfig GetConfig()
  {
    return new EndpointHostConfig
    {
      EnableFeatures = Feature.All.Remove(Feature.Xml | Feature.Soap),
      DebugMode = true,
      DefaultContentType = ContentType.Json
    };
  }

  public static IEnumerable<IPlugin> GetPlugins()
  {
    yield return new ValidationFeature();
  }
}
```

Obviously you can configure it how you like, but the important part is
that it's centralized out of each app host class.

So what does that give us? Well, now we can do something like this
(using NUnit to manage the integration tests):

```csharp
[SetUpFixture]
public class GlobalTestSetup
{
  private SelfAppHost host;

  [SetUp]
  public void SetUp()
  {
    this.SetupTestDb();

    this.host = new SelfAppHost(TestConfig.ConnString);
    this.host.Init();
    this.host.Start(TestConfig.TestHostUrl);
  }

  [TearDown]
  public void TearDown()
  {
    this.host.Stop();
  }


  public void SetupTestDb()
  {
    OrmLiteConfig.DialectProvider = SqlServerOrmLiteDialectProvider.Instance;
    using(var db = TestConfig.ConnString.OpenDbConnection())
    {
      db.DropAndCreateTable<SomeDTO>();
    }
  }
}
```

In NUnit, the `[SetUpFixture]` attribute marks a class as a "global"
test initializer (of sorts, read the NUnit docs for more information).

This means that the `SetUp` method gets called before any test is run,
and the `TearDown` method gets called after all tests have
completed. As long as your given testing framework has something
similar you're all good.

So now, for each integration test, just make sure your service client
uses the same base url that the SelfAppHost instance was started
with:

```csharp
[TestCase]
public void ShouldDoSomethingNeat()
{
  var client = TestConfig.CreateServiceClient();
  var response = client.Post(new SomeDTO());
  // Assert various things about the response, or check the DB to
  // ensure the DTO got inserted.
}
```

The setup might be a little tedious, but it pays off in keeping
everything nice and self-contained in your tests project. Plus, since
the services are now being hosted in-process, you can step-through
from client to server without breaking a sweat.

[1]: http://servicestack.net
[2]: http://www.nunit.org
[3]: http://www.jetbrains.com/resharper/
[4]: https://plus.google.com/117201192611184809497/posts/euVcrpLb5nW
