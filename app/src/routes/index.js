const { Router } = require("express");
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const axios = require("axios");
const { Character, Occupation, character_occuption } = require("../db.js");
const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
const getApiInfo = async () => {
  const apiurl = await axios.get("https://breakingbadapi.com/api/characters");
  const apiInfo = await apiurl.data.map((el) => {
    return {
      id: el.char_id,
      name: el.name,
      image: el.img,
      nickName: el.nickname,
      status: el.status,
      occupation: el.occupation.map((el) => el),
      birthday: el.birthday,
      appearance: el.appearance.map((el) => el),
    };
  });
  return apiInfo;
};
const getDbInfo = async () => {
  return await Character.findAll({
    include: {
      model: Occupation,
      attributes: ["name"],
      through: {
        attributes: [],
      },
    },
  });
};

const getAllCharacters = async () => {
  const apiInfo = await getApiInfo();
  const dbInfo = await getDbInfo();
  const infoTotal = apiInfo.concat(dbInfo);
  return infoTotal;
};

router.get("/characters", async (req, res) => {
  const name = req.query.name;
  const charactersTotal = await getAllCharacters();
  if (name) {
    let characterName = await charactersTotal.filter((el) =>
      el.name.toLowerCase().includes(name.toLocaleLowerCase())
    );
    characterName.length
      ? res.status(200).send(characterName)
      : res.status(404).send("No hay personaje con ese nombre");
  } else {
    res.status(200).send(charactersTotal);
  }
});
router.get("/occupations", async (req, res) => {
  const occupationsApi = await axios.get(
    "https://breakingbadapi.com/api/characters"
  );
  const occupations = occupationsApi.data.map((el) => el.occupation);
  const occucEach = occupations.map((el) => {
    for (let i = 0; i < el.length; i++) return el[i];
  });
  //console.log(occucEach);
  occucEach.forEach((el) => {
    Occupation.findOrCreate({
      where: { name: el },
    });
  });
  const allOccupations = await Occupation.findAll();
  res.send(allOccupations);
});

router.post("/character", async (req, res) => {
  let { name, nickName, birthday, image, status, createdInDb, occupation } =
    req.body;

  const characterCreated = await Character.create({
    name,
    nickName,
    birthday,
    image,
    status,
    createdInDb,
  });
  // ACA NO PASSO LA OCUPACION PQ ?  És necessario hacer la relacion de la ocupacion a parte

  let occupationDb = await Occupation.findAll({
    where: {
      name: occupation,
    },
    // aca tengo que encontrar em mis MODELO DE ocupaciones todos las que coincidan con los  nombres que lleham por BODY- tengo que encontrar en um modelo que ja tengo, que ya existe
  });
  characterCreated.addOccupation(occupationDb);
  res.send(200).send("Personaje creado con exito");
});
//npm i axios
module.exports = router;
