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
    { index:
      { text: 'Home'
      , link: 'http://example.com'
      }
    }
  , needPosts: []
  , paths:
    { dist: 'dist'
    , pages: 'src/markup/content/*.md'
    , posts: 'src/markup/content/posts/*.md'
    , templates: 'src/markup/templates/*.jade'
    }
  , opts:
    { jade:
      { basedir: 'src/markup/templates'
      , pretty: true
      }
    }
  , wpm: 225
  }
