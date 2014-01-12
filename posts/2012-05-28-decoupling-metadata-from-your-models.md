---
author: Bryan J. Ross
title: Decoupling metadata from your models
excerpt:
comments: true
layout: post
category: development
tags:
  - 'c#'
  - mvc
  - programming
post_format: [ ]
---
Most of the time, decorating your models with validation attributes
works just fine. But sometimes you need to separate your validation
logic from your models. For example, re-using your models across
multiple projects, but each project has it’s own validation rules.

<!-- more -->

## The standard approach

However, there’s a wealth of functionality that is supplied with the
DataAnnotations attributes. The standard way of decoupling your
DataAnnotations and models is the MetadataTypeAttribute. You use it
like so:

``` c#
using System;
using System.ComponentModel.DataAnnotations;
[MetadataType(typeof(AddressMeta))]
public class Address
{
  public int Id { get; set; }
  public string Address1 { get; set; }
  public string Address2 { get; set; }
  public string City { get; set; }
  public string State { get; set; }
  public string Zip { get; set; }
  public class AddressMeta
  {
    [Required]
    public int Id;
    [Required]
    public string Address1;
    /* etc. etc. */
  }
}
```

This approach works fine for most cases. However, in some cases, you
need to specify validation rules separately from your models. Some may
argue that that’s bad design, but arguing design isn’t the point of
this post.

Now, there’s plenty of validation libraries out there for MVC out
there, but what if you want to use the existing DataAnnotations
attributes, and just specify them somewhere else? Turns out, that’s
pretty easy.

## Throwing it in reverse

What I want to do is something like this:

``` c#
using System;
using System.ComponentModel.DataAnnotations;
public class Address
{
  public int Id { get; set; }
  public string Address1 { get; set; }
  public string Address2 { get; set; }
  public string City { get; set; }
  public string State { get; set; }
  public string Zip { get; set; }
}

[MetadataFor(typeof(Address))]
public class AddressMeta
{
  [Required]
  public int Id;
  [Required]
  public string Address1;
  /* etc. etc. */
}
```


MVC allows for an amazing amount of customization. It uses a Provider
architecture to get what it needs for various operations and
functionality, so customizing the Metadata and Validator lookups just
require adding a specialized provider.

First, we’re going to need a custom attribute for marking the Metadata
classes, and then we’ll need a provider for both Metadata, and for
Validators. The code is as follows:

``` c#
[AttributeUsage(AttributeTargets.Class)]
public class MetadataForAttribute : Attribute
{
  public MetadataForAttribute() {}
  public MetadataForAttribute(Type forType) { ForType = forType;
  }
  public Type ForType { get; set; }
  public static Type GetTargetType(Type fromType)
  {
    var attr =
      (MetadatForAttribute)Attribute.GetCustomAttribute(fromType,
          typeof(MetadataForAttribute));
    return attr.ForType;
  }
}

public class MetadataForMetadataProvider :
  DataAnnotationsModelMetadataProvider
{
  public Dictionary MetadataTypeMap { get; private set; }

  public MetadataForMetadataProvider()
  {
    var assemblies = AppDomain.CurrentDomain.GetAssemblies();
    var allTypes = assemblies.SelectMany(a => a.GetTypes());
    var metadataTypes = allTypes.Where(
        t => Attribute.IsDefined(t, typeof(MetadataForAttribute))).ToList();
    MetadataTypeMap = metadataTypes.ToDictionary(
        MetadataForAttribute.GetTargetType,
        t => t);
  }

  public MetadataForMetadataProvider(Dictionary typeMap)
  {
    MetadataTypeMap = typeMap;
  }

  protected override ICustomTypeDescriptor
    GetTypeDescriptor(Type type)
    {
      if (MetadataTypeMap.ContainsKey(type))
      {
        var provider = new AssociatedMetadataTypeTypeDescriptionProvider(type, MetadataTypeMap[type]);
        return provider.GetTypeDescriptor(type);
      }
      else
        return base.GetTypeDescriptor(type);
    }
}

public class MetadataForValidatorProvider :
  DataAnnotationsModelValidatorProvider
{
  public Dictionary MetadataTypeMap { get; private set; }

  public MetadataForValidatorProvider()
  {
    var assemblies = AppDomain.CurrentDomain.GetAssemblies();
    var allTypes = assemblies.SelectMany(a => a.GetTypes());

    var metadataTypes = allTypes.Where(
        t => Attribute.IsDefined(t, typeof(MetadataForAttribute))).ToList();

    MetadataTypeMap = metadataTypes.ToDictionary(
        MetadataForAttribute.GetTargetType,
        t => t);
  }

  public MetadataForValidatorProvider(Dictionary typeMap)
  {
    MetadataTypeMap = typeMap;
  }

  protected override ICustomTypeDescriptor
    GetTypeDescriptor(Type type)
    {
      if (MetadataTypeMap.ContainsKey(type))
      {
        var provider = new AssociatedMetadataTypeTypeDescriptionProvider(type, MetadataTypeMap[type]);
        return provider.GetTypeDescriptor(type);
      }
      else
        return base.GetTypeDescriptor(type);
    }
}
```


There might be a better way of doing this, but this way is
straightforward, easy to debug, and only incurs a one time cost at
application startup. Registering these providers is relatively simple.
Just add the following to your Global.asax.cs (or, god forbid
Global.asax.vb \*YUCK\*), in the Application_Starup method:

``` c#
var metadataForProvider = new MetadataForMetadataProvider();
ModelMetadataProviders.Current = metadataForProvider;
providers.Clear();
providers.Add(new MetadataForValidatorProvider(metadataForProvider.MetadataTypeMap));
```

And voila. Note, that this will also work with model hierarchies. Say
you want to extend a model into something like an AddressViewModel
with additional properties, perhaps for custom formatting, etc.. The
following will do the trick just nicely:

``` c#
public class Contact
{
  public int Id { get; set; }
  public string FirstName { get; set; }
  public string LastName { get; set; }
}

public class ContactViewModel : Contact
{
  public string FullName
  {
    get { return FirstName + " " + LastName; }
    set
    {
      var parts = value.Split(new [] { ' ' }, 2);
      FirstName = parts;
      LastName = parts;
    }
  }
}

[MetadataFor(typeof(Contact))]
public class ContactMeta
{
  [Required]
    public int Id;
  [Required]
    public string FirstName;
  [Required]
    public string LastName;
}

[MetadataFor(typeof(ContactViewModel))]
public class ContactViewModelMeta : ContactMeta
{
  [Description("Full Name")]
    public string FullName;
}
```

