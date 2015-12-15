module.exports =
  { defaultAuthor:
    { name: 'My Name'
    , link: 'http://example.com/about'
    }
  , defaultTemplate: 'page'
  , delims:
    { preview: '--MORE--'
    , yaml: '---'
    }
  , hostname: 'http://example.com'
  , nav:
    [
      { text: 'Home'
      , link: '/'
      }
    ]
  , needPosts: []
  , opts:
    { jade:
      { basedir: 'src/markup/templates'
      , pretty: true
      }
    }
  , paths:
    { dist: 'dist'
    , pages: 'src/markup/content/*.md'
    , posts: 'src/markup/content/posts/*.md'
    , templates: 'src/markup/templates/*.jade'
    }
  , wpm: 225
  }
