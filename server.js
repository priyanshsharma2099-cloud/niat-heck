import app from './server/app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Cluey Cart Server listening on port ${PORT}`);
});
