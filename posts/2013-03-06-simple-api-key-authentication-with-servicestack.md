---
layout: post
title: "Simple API Key Authentication with ServiceStack"
date: 2013-03-06 11:09
comments: true
categories: development
tags:
- servicestack
- c#
---

Sometimes you want to lock down your API to only allow certain clients
access. I'd like to share a simple way of doing just that, based on
HTTP headers and a simple pre-shared key.

<!-- More -->

Let's just dive right in, shall we?

First thing's first, let's add a RequestFilter to perform the
validation by extracting the key from a custom HTTP header:

``` c# AppHost.cs
public class AppHost : AppHostBase
{
  public override void Configure(Container container)
  {
    this.RequestFilters.Add((req, res, dto) => {
        var apiKey = req.Headers["X-ApiKey"];
        if (apiKey == null || !Clients.VerifyKey(apiKey))
        {
          throw HttpError.Unauthorized("Unauthorized");
        }
    });
  }
}
```

This static class we use to verify the key is valid, by checking
against a custom `ConfigurationSection` (defined shortly):


``` c# Clients.cs
public static class Clients
{
  private static Lazy<ClientSection> section = new Lazy<ClientSection>(() =>
        (ClientSection)ConfigurationManager.GetSection("apiClients"));

  public static bool VerifyKey(string apiKey)
  {
    return section.Value.Clients.Cast<ClientSection.ClientElement>()
           .Any(ce => ce.ApiKey == apiKey);
  }
}
```

And the custom `ConfigurationSection` is as follows:


``` c# ClientSection.cs
using System.Configuration;

public class ClientSection : ConfigurationSection
{
  [ConfigurationProperty("clients")]
  public ClientElementCollection Clients
  {
    get { return (ClientElementCollection)base["clients"]; }
  }

  public class ClientElement : ConfigurationElement
  {
    [ConfigurationProperty("apiKey", IsRequired = true)]
    public string ApiKey
    {
      get { return (string)base["apiKey"]; }
      set { base["apiKey"] = value; }
    }

    [ConfigurationProperty("name", IsRequired = true)]
    public string Name
    {
      get { return (string)base["name"]; }
      set { base["name"] = value; }
    }
  }

  public class ClientElementCollection : ConfigurationElementCollection
  {
    public override ConfigurationElementCollectionType CollectionType
    {
      get { return ConfigurationElementCollectionType.BasicMap; }
    }

    public ClientElement this[object key]
    {
      get { return this.BaseGet(key) as ClientElement; }
    }

    protected override ConfigurationElement CreateNewElement()
    {
      return new ClientElement();
    }

    protected override object GetElementKey(ConfigurationElement element)
    {
      return ((ClientElement)element).Name;
    }

    protected override bool IsElementName(string elementName)
    {
      return !string.IsNullOrEmpty(elementName) && elementName.Equals("client");
    }
  }
}
```

As you can see, by far the largest class is the custom configuration
section class. A necessary evil of .NET's configuration system.

What this setup allows is to have the following in your web.config (or
App.config if self-hosted):

``` xml [Web|App].config
<?xml version="1.0"?>
<configuration>
  <configSections>
    <section name="apiClients" type="ClientSection" requirePermission="false"/>
  </configSections>

  <apiClients>
    <clients>
      <client name="Client1" apiKey="somelongrandomkey" />
      <client name="Client2" apiKey="somelongrandomkey" />
      <!-- etc -->
    </clients>
  </apiClients>
</configuration>
```

_Note_: The `<configsection>` element needs a fully qualified type name,
so if you need to put it in a namespace, make sure to include it in
the `type` attribute.

Nice and easy client access management. All the client has to do is
send the appropriate HTTP header. For example:


``` http RAW HTTP
GET /json/reply/SomeRequest HTTP/1.1
Host: api.example.com
X-ApiKey: somelongrandomkey
```

If you're using the C# client, then it's `LocalHttpWebRequestFilter`
to the rescue:

``` c# AuthenticatedJsonServiceClient.cs
public class AuthenticatedJsonServiceClient : JsonServiceClient
{
  public AuthenticatedJsonServiceClient(string baseUri)
    : base(baseUri)
  {
    this.LocalHttpWebRequestFilter = req => {
      req.Headers.Add("X-ApiKey", "somelongrandomkey");
    };
  }
}

```

And that's about it! Now, I realize that this might not be the most
robust or 'enterprise-y' solution, but it's simple, straightforward,
and easy to manage.

You can also extend the `ClientElement` class if you need more
per-client data. For instance, I'm currently selecting a connection
string based on the ApiKey being sent over from the client:

``` c# Added to the ClientElement class
[ConfigurationProperty("connectionStringName", IsRequired = true)]
public string ConnectionStringName
{
  get { return (string)base["connectionStringName"]; }
  set { base["connectionStringName"] = value; }
}
```

And in web.config:

``` xml web.config
...
<client name="Client1" connectionStringName="Client1DB" apiKey="somelongrandomkey" />
...
```

Actually retrieving the value of that property per-request I'll leave
as an exercise for the reader ;)

Happy coding!
