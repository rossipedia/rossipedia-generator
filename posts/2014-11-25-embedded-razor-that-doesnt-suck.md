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

What's the big deal? Well, these templates needed to live in a library that
doesn't depend on `System.Web`, not an ASP.net project. And that, my friends,
is the point at which I should've purchased a strong bottle of scotch.

<!-- more -->

"What's the problem?" you say. "Hasn't that been done before?"

"Well, yeah... I guess... _technically_. But not _well_" I respond a touch too
defensively.

If you've tried this, you know the experience to be less than ideal. You have a
couple of options:

* Try to use Razor directly (System.Web.Razor? System.Web.WebPages.Razor?)
* Use a third party solution that has attempted to make this process slightly
less..._uncomfortable_.

The idea of getting all low level and digging into the raw Razor assembly
sounded slightly less appealing than sitting through a three hour Justin Bieber
concert, so I went with the third party option. Specifically,
[RazorGenerator][2].

All was not rainbows and unicorn farts, however. There are a few gotchas.
Hopefully this post will help you avoid some of them.


RazorGenerator
--------------

There are a couple options when using RazorGenerator. Searching for
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

namespace RazorLibrary
{
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

    public override string ToString()
    {
      return _writer.ToString();
    }
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

3. We override `ToString` to get at the rendered output.

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

However, this is a pretty useless template. There's no way to pass any data to
the template. This is where things get a little bit tricky (not too bad though),
so let's roll up our sleeves.




[1]: http://i.imgur.com/HUMSPMP.jpg
[2]: https://razorgenerator.codeplex.com/
