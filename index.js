const express = require('express');
const ldap = require('ldapjs');

const app = express();
const port = 3000;

app.get('/ldapquery', (req, res) => {
  // Get LDAP query parameters from the request object
  const { base, filter, scope } = req.query;

  // LDAP server configuration
  const ldapConfig = {
    url: 'ldap://ldap.forumsys.com',
    bindDN: 'uid=einstein,dc=example,dc=com',
    bindCredentials: 'password',
  };

  // LDAP query configuration
  const ldapQuery = {
    base: base || 'dc=example,dc=com',
    filter: filter || '(uid=username)',
    scope: scope || 'sub',
  };

  // Perform LDAP query
  performLDAPQuery(ldapConfig, ldapQuery, res);
});

function performLDAPQuery(ldapConfig, ldapQuery, response) {
  const client = ldap.createClient({
    url: ldapConfig.url,
  });

  client.bind(ldapConfig.bindDN, ldapConfig.bindCredentials, (bindErr) => {
    if (bindErr) {
      console.error('LDAP bind error:', bindErr);
      response.status(500).send('LDAP bind error');
      client.unbind(); // Unbind in case of bind error
      return;
    }

    const searchOptions = {
      filter: ldapQuery.filter,
      scope: ldapQuery.scope,
    };

    client.search(ldapQuery.base, searchOptions, (searchErr, searchRes) => {
      if (searchErr) {
        console.error('LDAP search error:', searchErr);
        response.status(500).send('LDAP search error');
        client.unbind(); // Unbind in case of search error
        return;
      }

      const entries = [];
      searchRes.on('searchEntry', (entry) => {
        entries.push(entry.object);
      });

      searchRes.on('searchReference', (referral) => {
        console.log('Referral:', referral);
      });

      searchRes.on('error', (error) => {
        console.error('Search error:', error);
        response.status(500).send('LDAP search error');
        client.unbind(); // Unbind in case of search error
      });

      searchRes.on('end', () => {
        response.json(entries);
        client.unbind((unbindErr) => {
          if (unbindErr) {
            console.error('LDAP unbind error:', unbindErr);
          }
        });
      });
    });
  });
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});