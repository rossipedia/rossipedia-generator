---
layout: post
title: "Dependency Injection considered harmful? Not so fast."
date: 2013-08-31 10:29
comments: true
categories:
- development
tags:
- solid
- patterns
---

A question came up on StackOverflow today:

> [What would be the most powerful argument for writing SOLID applications?][1]

One of the comments on this question caused a bit of a stir on
Twitter, as it was made by [Eric Lippert][4], who was on the C# team at
Microsoft for quite some time. Normally I agree with pretty much
everything he writes. But not this time.

<!-- more -->

His comment states:

> There is no killer argument for DI because DI is basically a bad
> idea. The idea of DI is that you take what ought to be
> implementation details of a class and then allow the user of the
> class to determine those implementation details. This means that the
> author of the class no longer has control over the correctness or
> performance or reliability of the class; that control is put into
> the hands of the caller, who does not know enough about the internal
> implementation details of the class to make a good choice.

Now, Eric Lippert is a smart guy. Like, _scary_ smart. His knowledge
of C# probably rivals that of Anders (Hejlsberg, creator of C#).
However, I have an issue with his argument, as it misses the big
picture.

As you may or may not know, [SOLID][2] is a set of principles guiding the
design and architecture of software, introduced by Robert C
Martin, AKA "Uncle Bob" (original article [here][3]).

The problem with Eric's comment is that it only addresses a single
point of the SOLID principle: the "D", which stands for the Dependency
Inversion Principle, which states one should depend on abstractions
rather than concretions. Taken in isolation, the comment actually
makes sense. But SOLID isn't about isolation. It's about applying
_all_ it's principles.

Let's take a few points in order:

> This means that the author of the class no longer has control over
> the correctness or performance or reliability of the class

If you apply the rest of SOLID, then this doesn't really hold water,
because:

* The class is only doing ONE well-defined thing (SRP)
* The dependencies that are being injected are doing one thing that is
well defined (SRP and ISP)
* Any implementation of those dependencies will be correct (LSP)

(OCP doesn't really apply here to this, as it sort of comes as a result of
 applying the other principles well and guides their implementation).

> ; that control is put into the hands of the caller, who does not know
> enough about the internal implementation details of the class to
> make a good choice

I also don't agree with this, because the whole point here is that
dependencies of a class, if designed well, have NO knowledge of what
class depends on them, and shouldn't have to. There's no
choice to be made.

With SOLID, you have four other principles that also guide your
architecture. These principles work together to form a single
methodology that has been proven many times over. If you pick just
one, or leave one out, then all bets are off.

[1]: http://stackoverflow.com/questions/18547909/what-would-be-the-most-powerful-argument-for-writing-solid-applications
[2]: http://en.wikipedia.org/wiki/SOLID_(object-oriented_design)#cite_note-ub-old-web-solid-1
[3]: http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod
[4]: http://ericlippert.com/
