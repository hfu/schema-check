# schema-check
PostGIS schema-check by pg for Node.js

# usage
```
$ vi config/default.hjson
$ node schema-check.js
```

# config/default.hjson
```
{
  host: example.com
  user: user
  password: secretpassword
  databases: [
    database1
    database2
  ]
}
```
