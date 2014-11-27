---
title: "Embedded Razor that doesn't suck"
date: 2014-11-25 17:15
categories:
- development
tags:
- c#
- .net
- razor
---

Recently I had need to integrate a templating system into the project I'm
working on, because [designers like that kind of thing][1]. Being a primarily
.NET shop, our defacto HTML generation language here at Stack Exchange is Razor.

What's the big deal? Well, these templates need to live in a library that
doesn't depend on `System.Web` (that is: _not_ an ASP.net project). 

<!-- more -->

RazorGenerator
--------------

There are a couple options when it comes to embedding Razor templates into your library.
For this example, I'm going to use [RazorGenerator][1]. Searching for
RazorGenerator in the Nuget Package manager yields about a handful of results:

![RazorGenerator search results](/assets/razorgenerator-results.png)

Go ahead and pick `RazorGenerator.MsBuild`. This enables the compilation of
Razor as a build step.

To test this out, go ahead and add a new `Test.cshtml` file. You'll need to add
it by adding a new Text file and naming it `Test.cshtml`, as class library
projects don't have the right settings for adding a Razor View directly. Enter
the following content:

```html
@* Generator: Template *@

<p>Hello, there!</p>
```

The `Generator: Template` directive at the top of the file tells RazorGenerator what type
of generator to use, in this case just a basic template with no bells and
whistles (for other types, see the [home page][1]).

Okay, try to build again. BOOM: 

```nohighlight
error CS0246: The type or namespace name 'RazorGenerator' could not be found
```

This is because by default, RazorGenerator creates templates that inherit from
`RazorGenerator.Templating.RazorTemplateBase`, which is provided by the
**RazorEngine.Templating** nuget package. However, I wanted to have complete
control over my templates, so we'll just skip over that part, and tell our template
to inherit from a custom base class:

```html
@* Generator: Template *@
@inherits RazorLibrary.MyTemplate

<p>Hello, there!</p>
```

And `MyTemplate.cs` looks like this:

```csharp
using System.IO;

public abstract class MyTemplate
{
  private readonly StringWriter _writer = new StringWriter();

  public abstract void Execute();

  protected void WriteLiteral(string text)
  {
    if (string.IsNullOrEmpty(text))
      return;

    _writer.Write(text);
  }

  protected void Write(object value)
  {
    if (value == null)
      return;

    _writer.Write(value);
  }

  public override string ToString()
  {
    return _writer.ToString();
  }
}
```

What's going on
---------------

A couple of things to note:

1. The generated template has a method `override void Execute()`, in which all
   the output gets rendered, which is why the base class has a `abstract void
   Execute();` method declared.

2. All the literal content (HTML tags/text, etc) is written by calling a `void
   Write(string)` method. Our implementation simply writes the text to a
   `System.IO.StringWriter` instance.

3. All values (eg: @somevar) get written using a `void Write(object)` method.
   Implementation is the same as above.

4. We override `ToString` to get at the rendered output.

As it stands, right now we have a functional template. We can create an
instance of it, execute it, and get the output:

```csharp
// The class name is the name of the .cshtml file
// in this case, it's Test.cshtml
var template = new Test();
template.Execute();
Console.WriteLine(template.ToString());
```

Neat!

However, this is a pretty useless template. There's no way to pass in data for
the template to render! Let's make some changes to allow that.


Generalizin'
------------

First things first, let's make our base template class a bit more flexible. I'll
rename it from the illustriously named `MyTemplate`, to `Template`, and we'll
make it generic. The type passed in will represent the type of the data that is
used to render the template. We'll supply this data via a `Model` property.

_**Note**: While generally I prefer passing this kind of data in via the
constructor, doing things that way using RazorGenerator is, well, less than
comfortable._

Our base template class now looks like this:

```csharp
public abstract class Template<TData>
{
  private readonly StringWriter _writer = new StringWriter();
  private readonly TData _data;

  public TData Model { get; set; }

  public abstract void Execute();

  protected void WriteLiteral(string text)
  {
    if (string.IsNullOrEmpty(text))
      return;

    _writer.Write(text);
  }

  protected void Write(object value)
  {
    if (value == null)
      return;

    _writer.Write(value);
  }

  public override string ToString()
  {
    return _writer.ToString();
  }
}
```

Then, let's define the data we want to render:

```csharp
public class Person
{
  public string Name { get; set; }
  public int Age { get; set; }
}
```

Finally, let's rename `Test.cshtml` to `PersonTemplate.cshtml`, and update
it:

```html
@* Generator: Template *@
@inherits RazorLibrary.Template<RazorLibrary.Person>

<p>Hi!</p>

<p>The person named @Model.Name is @Model.Age years old.</p>
```

And that's about it! You now have a library project that exposes templates,
without any dependency on `System.Web`.

For example:

```csharp
using RazorLibrary;

var person = new Person { 
	Name = "John Doe",
	Age = 34
};

var template = new PersonTemplate {
  Model = person
};
template.Execute();
Console.WriteLine(template.ToString());
```

Hope you find this useful. Happy coding!

[1]: https://razorgenerator.codeplex.com/

