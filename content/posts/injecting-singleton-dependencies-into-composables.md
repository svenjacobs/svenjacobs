---
title: "Injecting singleton dependencies into composables"
date: 2021-10-05T21:50:00+02:00
tags: ["android", "jetpack", "compose", "hilt"]
---
In this short blog post I want to showcase a pattern for "injecting" global, singleton dependencies into composable functions via [Hilt](https://developer.android.com/training/dependency-injection/hilt-android). You should be familiar with [Compose](https://developer.android.com/jetpack/compose) and Hilt. An understanding of [ViewModel](https://developer.android.com/topic/libraries/architecture/viewmodel) and [Coil](https://github.com/coil-kt/coil) is helpful, but not required.

In Compose, a composable function should only receive the data via function arguments that is required for rendering the UI. This design pattern decouples composables and improves reusability. It is true for plain data, but it might not be that helpful for dependencies. Imagine for instance setting up a Coil `ImageLoader` instance via Hilt, adding a few custom interceptors, a logger, etc. Because of this configuration, you want to use the same singleton instance throughout your app. Therefore you install the module which configures `ImageLoader` into Hilt's `Singleton` component.

Most times you should not have to pass dependencies to composables other than required data, as mentioned above. If you find yourself doing this a lot, there might be a problem with the design of your composables. However in case of Coil's [Compose support](https://coil-kt.github.io/coil/compose/), you do need an instance of `ImageLoader` if you want to benefit from its special configuration.

At one of your top-level composables which represents a screen, you might access dependencies via a `ViewModel`. That is fine so far. Now a child composable two layers down also needs that instance of `ImageLoader`. You might pass down the `ViewModel` as a function argument, which is not cool. You might just pass down the `ImageLoader` instance, which is better but still not cool. It's cumbersome and does not help in improving readability, reusability and testability of composables.

```kotlin
@Composable
fun MainScreen(viewModel: MainViewModel = viewModel()) {
  Child1(viewModel.imageLoader)
}

@Composable
fun Child1(imageLoader: ImageLoader) {
  Child2(
    imageUrl = "www.someurl.com",
    imageLoader = imageLoader
  )
}

@Composable
fun Child2(
  imageUrl: String,
  imageLoader: ImageLoader
) {
  Image(
    painter = rememberImagePainter(
      data = imageUrl,
      imageLoader = imageLoader
    )
  )
}
```

Do you see how `ImageLoader` pollutes `Child1`? It gets worse if `ImageLoader` is required by more child composables deeper down.

## The solution

Before I go into the details I want to emphasize that this solution only works with dependencies that are declared as singletons in Hilt. It does not work for dependencies that should be tied to a lifecycle which is smaller, for instance the lifecycle of a composable.

That being said, let's improve the code sample above.

First of all we need to know that we cannot use the `@Inject` annotation on parameters of composable functions. Maybe this will be possible in the future – who knows – but it's not possible at the time of writing this article. So this complicates things a bit. But how do we obtain our Hilt dependencies then? Luckily, Hilt provides a solution for accessing dependencies in code which is not one of Hilt's supported classes (`Activity`, `Fragment`, `Service`, …). It is called [EntryPoint](https://dagger.dev/hilt/entry-points.html). If you're not familiar with `EntryPoint`, please read the linked documentation first.

Let's write an `EntryPoint` which provides our `ImageLoader` dependency:

```kotlin
@EntryPoint
@InstallIn(SingletonComponent::class)
interface ComposeEntryPoint {
    val imageLoader: ImageLoader
}
```

Now we need to initialize `ComposeEntryPoint` from a Compose context. We utilize the [CompositionLocal](https://developer.android.com/jetpack/compose/compositionlocal) `LocalContext` for accessing the current Android `Context` inside a composable. Let's create a file `Providers.kt` (or name it anything you want):

```kotlin {hl_lines=[8]}
private lateinit var entryPoint: ComposeEntryPoint

@Composable
fun requireEntryPoint(): ComposeEntryPoint {
    if (!::entryPoint.isInitialized) {
        entryPoint =
            EntryPoints.get(
                LocalContext.current.applicationContext,
                ComposeEntryPoint::class.java,
            )
    }
    return entryPoint
}
```

As you can see we use a `lateinit` property. We ensure that only one instance of `ComposeEntryPoint` is created and that further calls to `requireEntryPoint` will return the same instance. It is a minor optimization. Why not use `by lazy { … }` you ask? That is a good question! Unfortunately, the lambda which is passed to `lazy` is not a composable function. Hence we cannot access `LocalContext` there.

Last but not least, in the same file as above, we create the actual function that returns our dependency in question:

```kotlin
@Composable
fun imageLoader() = requireEntryPoint().imageLoader
```

Now we can improve the code sample:

```kotlin {hl_lines=[14]}
@Composable
fun MainScreen() {
  Child1()
}

@Composable
fun Child1() {
  Child2(imageUrl = "www.someurl.com")
}

@Composable
fun Child2(
  imageUrl: String,
  imageLoader: ImageLoader = imageLoader()
) {
  Image(
    painter = rememberImagePainter(
      data = imageUrl,
      imageLoader = imageLoader
    )
  )
}
```

I hope you find this simple pattern useful 🙂
