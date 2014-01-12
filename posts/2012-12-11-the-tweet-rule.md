---
author: Bryan J. Ross
title: The tweet rule
excerpt:
layout: post
comments: true
categories: development
tags:
- c#
- programming
---
I ran across this lovely little interface method today:

``` c#
public interface IOrderProcessor
{
  TransactionResponse CreateOrder(
      Cart cart,
      string email,
      Payment payment,
      Address billingAddress,
      Address shippingAddress,
      string notes,
      int orderId);
}
```

<!-- more -->

Aside from the glaring [SRP][1] violations, the main thing about this
method is it's length. Holy god is it long. I immediately wondered if
I could tweet it. Just as I thought: no dice.

It struck me that maybe that was a pretty good guideline. Twitter's
made a massive (and I mean ungodly huge) business off of 140
characters. That seems to be a good indication of the attention span
of the human race, so it seems that it's a good indication of whether
your method signature is too long.

So as of now I'm going to adopt the Tweet Rule&trade;:

> If your method signature is too long to fit in a tweet, then it's
> too long.

I'm going to strive to keep all my methods obeying this rule, as well
as under 10 statements in length (roughly). It will be interesting to
see how these limitations affect the way I solve problems in code.

[1]: http://en.wikipedia.org/wiki/Single_responsibility_principle

