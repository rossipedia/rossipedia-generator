---
author: Bryan J. Ross
title: Compiling ASCX files into a class library
excerpt:
layout: post
comments: true
category: programming
tags:
  - asp.net
  - webforms
post_format: [ ]
---
Recently, I needed to reuse some user controls across multiple webforms
applications. What I wanted was a way for our UI guy to author and develop
these controls using *.ascx and *.ascx.(cs|vb) code-behind files, since that
was what he knew and was good at.

There’s a couple of ways to do this, some involving embedding the ASCX file as
an embedded resource. I didn’t want to go that route tho. I did find
[one reference][1] that pointed me in the right direction though. But it wasn’t
quite exactly what I needed. For one, it didn’t play nicely with any other
project references your control library might need. So, using Scott’s post as a
starting point, I came up with a solution that I think works out very nicely.

<!-- more -->

## The setup

You’ll need to make sure you download and install [ILMerge][2] in order for
this to work. These steps assume the default install location.

Start with an empty C# class library project, and add a reference to
System.Web.

Add your control. For this example I’m just going to use the following super
basic control (named MyControl.ascx):

``` html
<%@ Control Language="C#" ClassName="ControlTest.MyControl"
CodeFile="MyControl.ascx.cs" Inherits="ControlTest.MyControlCode"
AutoEventWireup="true" %>

<asp:MultiView runat="server" ID="mvName">
<Views>
   <asp:View runat="server" ID="vwDisplay">
       Your name is <asp:Label runat="server" ID="lblName" />
       <asp:Button runat="server" ID="btnReset"
       OnClick="ResetButtonClick" Text="Reset Name" />
   </asp:View>
   <asp:View runat="server" ID="vwInput">
       Enter your name: <asp:TextBox runat="server"
       ID="txtName"></asp:TextBox>
       <asp:Button runat="server" ID="btnSet" OnClick="SetButtonClick"
       Text="Set Name" />
   </asp:View>
</Views>
</asp:MultiView>
```

Note: You’ll have to add this by selecting “Text File” as Class Library
projects don’t give you the web control templates.

A couple of important things to note:

1.  The **CodeFile **attribute is used instead of the **CodeBehind** attribute.
This is due to  the fact that the ASP.NET compiler ignores files referenced
by **CodeBehind.**
2.  The **ClassName **attribute is used so that we can specify what class name
we want (including the namespace). Otherwise, we’d have to resort to using
silly things like **<asp:mycontrol_ascx />**. And that’s just silly.

Here’s the contents of my **MyControl.ascx.cs** file:

``` c#
namespace ControlTest
{
    using System;
    using System.Web.UI;

    public partial class MyControlCode : UserControl
    {
        public void Page_Load(object sender, EventArgs e)
        {
                if(!IsPostBack)
                {
                        this.mvName.SetActiveView(this.vwInput);
                }
        }

        public void SetButtonClick(object sender, EventArgs e)
        {
                this.lblName.Text = this.txtName.Text;
                this.mvName.SetActiveView(this.vwDisplay);
        }

        public void ResetButtonClick(object sender, EventArgs e)
        {
                this.lblName.Text = string.Empty;
                this.mvName.SetActiveView(this.vwInput);
        }
    }
}
```


Pretty basic stuff. Now here’s where the magic happens. Be warned: this gets a
little down and dirty. Right click the project, and click “Unload Project”,
then right click it again and hit “Edit [Project name]…”. This is going
to open up the actual project file in the XML editor.

Down at the bottom, right before the end **</Project>**, add the following
targets:

``` xml
<Target Name="BuildReferences">
        <MSBuild Projects="@(ProjectReference)" Targets="Build"
        BuildInParallel="True">
                <Output TaskParameter="TargetOutputs"
                ItemName="ReferencedAssemblies" />
        </MSBuild>
</Target>
<Target Name="CompileUserControls" DependsOnTargets="BuildReferences"
Inputs="@(Compile);@(Content)"
Outputs="$(OutputPath)\$(AssemblyName).dll">
        <PropertyGroup>
                <TempDirectory>$(MSBuildProjectDirectory)\temp</TempDirectory>
                <ILMergeEXE>$(ProgramFiles)\Microsoft\ILMerge\ILMerge.exe</ILMergeEXE>
        </PropertyGroup>
        <Copy SourceFiles="@(ReferencedAssemblies)"
        DestinationFolder="$(MSBuildProjectDirectory)\bin"
        SkipUnchangedFiles="true" />
        <AspNetCompiler Debug="$(DebugSymbols)"
        PhysicalPath="$(MSBuildProjectDirectory)"
        TargetPath="$(TempDirectory)"
        VirtualPath="$(MSBuildProjectDirectory)" Updateable="false"
        Force="true" />
        <CreateItem Include="$(TempDirectory)\bin\App_Web*.dll">
                <Output ItemName="PrecompiledAssemblies"
                TaskParameter="Include" />
        </CreateItem>
        <MakeDir Directories="$(OutputPath)" />
        <Exec Command="&quot;$(ILMergeEXE)&quot; /union
        /out:$(OutputPath)\$(AssemblyName).dll /targetplatform:v4
        @(PrecompiledAssemblies, ' ')" />
</Target>
<Target Name="Clean">
        <RemoveDir Directories="$(TempDirectory)" />
        <RemoveDir Directories="$(OutputPath)" />
</Target>
```


Now, change the **DefaultTargets** attribute of the **<Project> element at the
top of the file to have the value “CompileUserControls”. You want it to look
like this:**

``` xml
<Project ToolsVersion="4.0" DefaultTargets="Build"
xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
```


Now save and close that file, right click the project in Solution Explorer,
    reload the project, and then hit “Build”. You’ll notice the build process
    takes a little longer than usual.

What’s happening behind the scenes is this:

1.  MSBuild is calling the tool **aspnet_compiler.exe** to build each ascx and
        ascx.cs file into their own assemblies. This is what happens when you
        pre-compile an ASP.NET web site or web application
2.  The individual assemblies are then merged using ILMerge into a single final
        assembly
3.  That assembly is placed in the output folder for the current configuration.

This is set up so that it won’t rebuild the dll if it doesn’t need to. Also, it
won’t compile in any output dll’s that are dependencies of this project.

Something to be aware of: This relies on the fact that currently the
aspnet_compiler tool generates assemblies prefixed by the string **“App_Web”**.
This could possibly change in the future. Just make sure any projects that your
control library references don’t start with ”App_Web”, or else they’ll get
merged in to the resulting control dll, which you probably don’t want to
happen.

Now, add an empty ASP.NET Web Application to the solution, and add a project
reference to the ControlTest (or whatever yours is called) project.

This is the default.aspx file:

``` html
<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="default.aspx.cs"
Inherits="ControlTestWeb._default" %>
<%@ Register tagPrefix="controls" namespace="ControlTest"
assembly="ControlTest" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
    <head runat="server">
        <title></title>
    </head>
    <body>
        <form id="form1" runat="server">
            <div>

                <controls:MyControl runat="server" ID="myControl" />

            </div>
        </form>
    </body>
</html>
```

[1]: http://odetocode.com/blogs/scott/archive/2005/10/06/using-msbuild-and-ilmerge-to-package-user-controls-for-reuse.aspx
[2]: http://www.microsoft.com/en-us/download/details.aspx?id=17630
