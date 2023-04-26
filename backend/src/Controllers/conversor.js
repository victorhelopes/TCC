const jsonArchive = require("../models/jsonArchiquive");
const fs = require("fs");
const path = require("path");


// - pesquisa sobre ferramentas ETL

// - criar um parser de JSON que leia uma base de documentos e crie um modelo relacional,
//  com agrupamentos modelados como relacionamentos entre relações

// - após a criação do modelo e extração/tranformação/carga dos dados da base de JSON para 
// um BD relacional, novos documentos JSON podem exigir alterações/criações de tabelas para novas transformações/cargas


let archives = []
let archivesData = []
let tableAttributes = []
let infos = [[]]
let tables = [];
let exists = 0;

module.exports = {
  async get(req, res) {
    archives = await jsonArchive.find();
    getArchives()
    for (let i = 0; i < archives.length; i++) {
      let tableName = archives[i].key.split("-")[1].split(".")[0];
      tables.push(tableName);
      tableAttributes.splice(i, 0, []);
      for (let j = 0; j < archivesData[i].length; j++) {
        convertdataBase(archivesData[i][j], i, [tableName]);
      }
    }
    let aux = [];
    let sql = '';
    let allSQL = '';
    let hasForeignKey = 0
    console.log("Infos: ", infos);
    console.log("tableAttributes: ", tableAttributes);
    console.log("tables: ", tables);
    while (aux.length < tables.length) {
      for (let i = 0; i < tables.length; i++) {
        hasForeignKey = 0
        for (let j = 0; j < tableAttributes[i].length; j++) {
          if (tableAttributes[i][j].type == 'foreignKey') {
            hasForeignKey = 1
            let nameTable = ''
            for (let x = 0; x < (tableAttributes[i][j].name.split('_')).length; x++) {
              if ((tableAttributes[i][j].name.split('_'))[x] != 'id') {
                if ((tableAttributes[i][j].name.split('_'))[x + 1] == 'id') {
                  nameTable += tableAttributes[i][j].name.split('_')[x]
                } else {
                  nameTable += tableAttributes[i][j].name.split('_')[x] + '_'
                }
              }
            }
            let auxTables = aux.find(info => {
              return info == nameTable
            })
            if (auxTables) hasForeignKey = 0
          }
        }
        let hasTable = aux.find(table => {
          return table == tables[i]
        })

        if (!hasForeignKey && !hasTable) {
          aux.push(tables[i])
          sql = 'CREATE TABLE ' + tables[i] + '('
          for (let j = 0; j < tableAttributes[i].length; j++) {
            sql += tableAttributes[i][j].name + ' '
            if (tableAttributes[i][j].type == 'string' || tableAttributes[i][j].type == 'object') sql += ('varchar(255), ')
            if (tableAttributes[i][j].type == 'number') tableAttributes[i][j].name == 'id' ? sql += ('INT NOT NULL, ') : sql += ('INT, ')
            if (tableAttributes[i][j].type == 'boolean') sql += 'BOOLEAN, '
            if (tableAttributes[i][j].type == 'foreignKey') {
              sql += 'INT, ';
              sql += `FOREIGN KEY (${tableAttributes[i][j].name}) REFERENCES ${tableAttributes[i][j].name.split('_')[0]}(id),`
            }
          }
          hasId = tableAttributes[i].find(info => {
            return info.name == 'id'
          })
          if (hasId) sql += 'PRIMARY KEY (id)'
          else {
            sql += 'id INT NOT NULL, '
            sql += 'PRIMARY KEY (id)'
          }
          sql += ');'

          for (let k = 0; k < infos[i].length; k++) {
            sql += 'INSERT INTO ' + tables[i] + ' VALUES ('
            for (let instances = 0; instances< infos[i][k].length-1; instances++)
              sql += (infos[i][k][instances] + ' ,')
              sql += (infos[i][k][infos[i][k].length-1 ] + ');')
          }
        }
        if (hasForeignKey && !hasTable) {
          aux.push(tables[i])
          sql = 'CREATE TABLE ' + tables[i] + '('
          for (let j = 0; j < tableAttributes[i].length; j++) {
            sql += tableAttributes[i][j].name + ' '
            if (tableAttributes[i][j].type == 'string' || tableAttributes[i][j].type == 'object') sql += ('varchar(255), ')
            if (tableAttributes[i][j].type == 'number') tableAttributes[i][j].name == 'id' ? sql += ('INT NOT NULL AUTO_INCREMENT, ') : sql += ('INT, ')
            if (tableAttributes[i][j].type == 'boolean') sql += 'BOOLEAN, '
          }
          hasId = tableAttributes[i].find(info => {
            return info.name == 'id'
          })
          foreignKeys = []
          let nameAttribute = ''
          tableAttributes[i].map(info => {
            let fullName = info.name.split('_')
            nameAttribute = ''
            for (let name = 0; name < fullName.length; name++) {
              if (fullName[name] != 'id') {
                nameAttribute += fullName[name]
              }
            }
            if (tables.find(table => {
              return table == nameAttribute
            })) {
              sql += 'FOREIGN KEY (' + nameAttribute + '_id' + ') REFERENCES ' + nameAttribute + '(id),'
            }
          })
          if (hasId) sql += 'PRIMARY KEY (id)'
          else {
            sql += 'id INT NOT NULL, '
            sql += 'PRIMARY KEY (id)'
          }
          sql += ');'

          for (let k = 0; k < infos[i].length; k++) {
            sql += 'INSERT INTO ' + tables[i] + ' VALUES ('
            for (let instances = 0; instances< infos[i][k].length-1; instances++)
              sql += (infos[i][k][instances] + ' ,')
              sql += (infos[i][k][infos[i][k].length-1 ] + ');')
          }

        }


        if (sql != '') {
          allSQL += (sql)
          sql = ''
        }
        hasId = null
        hasForeignKey = 0
      }
    }
    res.json(allSQL);
  },

  async post(req, res) {
    const { originalname: name, filename: key } = req.file;
    const post = await jsonArchive.create({
      name,
      key,
    });
    res.json(post);
  },
};

function getArchives() {
  for (let i = 0; i < archives.length; i++) {
    let fileData = fs.readFileSync(path.resolve(__dirname, "..", "..", "tmp", "uploads", archives[i].key))
    let response = fileData.toString().split('\n')
    let = archiveDataAux = []
    response.map(item => {
      archiveDataAux.push(JSON.parse(item))
    })
    archivesData.push(archiveDataAux)
  }
}

function convertdataBase(archivesData, indexArchive, keys) {
  infos[indexArchive].push([]);
  Object.keys(archivesData).forEach(function (key) {
    exists = 0;
    tables.map((readKey, index) => {
      if (readKey == key) {
        return (exists = index);
      }
    });
    if (typeof archivesData[key] == "object" && archivesData[key] != null) {
      if (!exists) {
        tables.push(key);
        infos.push([])
        tableAttributes.push([]);
      }

      if (Array.isArray(archivesData[key])) {
        if (archivesData[key].length != 0) {
          if (typeof archivesData[key][0] == 'object') {
            keys.push(key)
            const type = verifica1xNorNxM(keys)
            if (type == '1Xn') {
              const pos = exists == 0 ? tableAttributes.length - 1 : exists;
              for (let i = 0; i < archivesData[key].length; i++) {
                convertdataBase(archivesData[key][i], pos, keys)
              }

              const tableSon = tables.findIndex(table => {return table === key})
              const response = tableAttributes[tableSon].find(item => {
                if (item.name == tables[tableSon-1 ] + "_id") return 1
              })
              if (!response) tableAttributes[tableSon].push({ name: tables[tableSon-1 ] + "_id", type: "foreignKey" });              
              infos[tableSon].map(info => {
                archivesData[key].map(value=>{
                  let objectAux = []
                  Object.keys(value).forEach( attribute =>{
                    objectAux.push(value[attribute]);
                })
                JSON.stringify(info) == JSON.stringify(objectAux) ? info.push(getId(keys[keys.length-2], archivesData )) : null
                })
              })
              keys.pop();
            } else {
              const pos = exists == 0 ? tableAttributes.length - 1 : exists;
              for (let i = 0; i < archivesData[key].length; i++) {
                convertdataBase(archivesData[key][i], pos, keys)
              }

              let existsTableRelation = 0;
              tables.map((readKey, index) => {
                if (readKey == tables[indexArchive] + '_' + key || readKey == key + '_' + tables[indexArchive]) {
                  return (existsTableRelation = index);
                }
              });

              if (!existsTableRelation) {
                infos.push([])
                tables.push(tables[indexArchive] + '_' + key)
                tableAttributes.push([{ name: tables[indexArchive] + '_id', type: 'foreignkey' }, { name: key + '_id', type: 'foreignkey' }]);
                existsTableRelation = tables.length -1
              }

              archivesData[key].map(value=>{
                const idSon = getId(key, value)
                const idFather = infos[keys.length -2].length -1;
                infos[existsTableRelation].push([idFather, idSon])
              })
              keys.pop()
            }
          } else {
            let existsTableValues = 0;
            tables.map((readKey, index) => {
              if (readKey == key || readKey == key + 'Values') {
                return (existsTableValues = index);
              }
            });
            if (tableAttributes[existsTableValues].length == 0) {
              tableAttributes[existsTableValues] = [{ name: tables[indexArchive] + '_id', type: 'foreignkey' }, { name: 'values', type: typeof archivesData[key][0] }];
              tables[existsTableValues] = (key)
            }
            const id = getId(tables[indexArchive], archivesData[key]);
            archivesData[key].map(item => {
              infos[existsTableValues].push([id, item])
            })
            console.log("ID: ", id, tables[indexArchive], archivesData[key])
          }
        }
      } else {
        if (archivesData[key].length != 0)
          fatherTableHaveThisAttributes = 0;
        tableAttributes[indexArchive].map((attibutes) => {
          if (attibutes.name == key + "_id")
            return (fatherTableHaveThisAttributes = 1);
        });

        const id = getId(key, archivesData[key]);
        infos[indexArchive][infos[indexArchive].length - 1].push(id)
        if (!fatherTableHaveThisAttributes) {
          tableAttributes[indexArchive].push({
            name: key + "_id",
            type: "foreignKey",
          });
        }

        const pos = exists == 0 ? tableAttributes.length - 1 : exists;
        keys.push(key)
        convertdataBase(archivesData[key], pos, keys)
        keys.pop()
      }
    } else {
      const response = tableAttributes[indexArchive].find(item => {
        if (item.name == key) return 1
      })
      infos[indexArchive][infos[indexArchive].length - 1].push(archivesData[key])
      if (!response) {
        tableAttributes[indexArchive].push({ name: key, type: typeof archivesData[key] });
      }
    }
  });
}

function verifica1xNorNxM(keys) {
  let response = []
  for (let i = 0; i < archives.length; i++) {
    for (let j = 0; j < archivesData[i].length; j++) {
      response.push(getValue(archivesData[i][j], 0, keys))
    }
  }
  for (let i = 0; i < response.length; i++) {
    for (let j = 0; j < response[i].length; j++) {
      for (let k = i + 1; k < response.length; k++) {
        for (let l = 0; l < response[k].length; l++) {
          if (JSON.stringify(response[i][j]) == JSON.stringify(response[k][l])) {
            return 'NxM'
          }
        }
      }
    }
  }
  return '1Xn'
}

function getId(tableName, value){
  let objectAux = []
  Object.keys(value).forEach( key =>{
    objectAux.push(value[key]);
  })
  tableIndex = tables.findIndex(name => {
    if(name == tableName) return true;
  })

  const instances = infos[tableIndex]
  const id = instances.findIndex(instance=>{
    if(JSON.stringify(instance) == JSON.stringify(objectAux))
      return true;
  })
  if(id !== -1){
    return id +1;
  }
  return instances.length == 0 ? 1 : instances.length;
}

function getValue(archive, index, key) {
  let response = []
  let aux = []
  let i = index
  while (i < key.length) {
    aux = archive[key[i]]
    if (typeof (aux) == 'object' && aux && aux.length > 0) {
      for (let j = 0; j < aux.length; j++) {
        i += 1
        response.push(getValue(aux[j], i, key))
        i -= 1
      }
      return response;
    }
    i++;
  }
  if (i == key.length - 1) return aux
  return archive

}
