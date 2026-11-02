import { prisma } from "../config/prisma.js";

const success = (res, data, message, status = 200) =>
  res.status(status).json({ success: true, data, message });

const statusDto = (status) => ({ id: status.statusId, name: status.statusName });
const categoryDto = (category) => ({ id: category.categoryId ?? category.videoCategoryId, name: category.categoryName ?? category.name });

export const getPublicationStatuses = async (req, res, next) => {
  try {
    const statuses = await prisma.publicationStatus.findMany({ orderBy: { statusId: "asc" } });
    return success(res, statuses.map(statusDto));
  } catch (error) {
    return next(error);
  }
};

export const getPetCareCategories = async (req, res, next) => {
  try {
    const categories = await prisma.petCareCategory.findMany({ where: { isDeleted: false }, orderBy: { categoryName: "asc" } });
    return success(res, categories.map(categoryDto));
  } catch (error) {
    return next(error);
  }
};

export const createPetCareCategory = async (req, res, next) => {
  try {
    const name = String(req.body.petCareCategory ?? req.body.categoryName ?? "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Category name is required." });
    const category = await prisma.petCareCategory.upsert({
      where: { categoryName: name },
      update: { isDeleted: false },
      create: { categoryName: name },
    });
    return success(res, categoryDto(category), "Category created successfully.", 201);
  } catch (error) {
    return next(error);
  }
};

export const getPetCareIcons = async (req, res, next) => {
  try {
    const icons = await prisma.petCareIcon.findMany({ orderBy: { iconId: "asc" } });
    return success(res, icons.map((icon) => ({
      id: icon.iconId, iconName: icon.iconName, iconKey: icon.iconKey, name: icon.iconName,
    })));
  } catch (error) {
    return next(error);
  }
};

const tipDto = (tip) => ({
  id: tip.tipId,
  title: tip.title,
  shortDescription: tip.shortDescription ?? tip.description,
  detailedContent: tip.detailedContent ?? tip.description,
  learnMoreURL: tip.linkUrl ?? "",
  iconID: tip.iconId,
  icon: tip.icon?.iconKey ?? tip.icon?.iconName,
  petCareCategoryID: tip.contentCategoryId,
  category: tip.contentCategory?.categoryName ?? tip.category,
  pubStatusID: tip.publicationStatusId,
  status: tip.publicationStatus?.statusName ?? "Draft",
  createdAt: tip.createdAt,
  updatedAt: tip.updatedAt,
});

export const getPetCareTips = async (req, res, next) => {
  try {
    const tips = await prisma.petCareTip.findMany({
      where: { isDeleted: false, type: "Article" },
      include: { icon: true, publicationStatus: true, contentCategory: true },
      orderBy: { tipId: "desc" },
    });
    return success(res, tips.map(tipDto));
  } catch (error) {
    return next(error);
  }
};

export const createPetCareTip = async (req, res, next) => {
  try {
    const title = String(req.body.title ?? "").trim();
    if (!title) return res.status(400).json({ success: false, message: "Title is required." });
    const category = req.body.petCareCategoryID
      ? await prisma.petCareCategory.findUnique({ where: { categoryId: Number(req.body.petCareCategoryID) } })
      : null;
    const tip = await prisma.petCareTip.create({
      data: {
        type: "Article",
        category: "Miscellaneous",
        title,
        description: String(req.body.shortDescription ?? req.body.detailedContent ?? "").slice(0, 1000),
        shortDescription: String(req.body.shortDescription ?? "").slice(0, 180) || null,
        detailedContent: String(req.body.detailedContent ?? "").slice(0, 500) || null,
        linkUrl: String(req.body.learnMoreURL ?? "").slice(0, 255),
        iconId: req.body.iconID ? Number(req.body.iconID) : null,
        publicationStatusId: req.body.pubStatusID ? Number(req.body.pubStatusID) : 1,
        contentCategoryId: category?.categoryId ?? null,
        uploaderAccountId: req.user.accountId,
      },
      include: { icon: true, publicationStatus: true, contentCategory: true },
    });
    return success(res, tipDto(tip), "Article created successfully.", 201);
  } catch (error) {
    return next(error);
  }
};

export const updatePetCareTip = async (req, res, next) => {
  try {
    const tipId = Number(req.params.tipId);
    const tip = await prisma.petCareTip.update({
      where: { tipId },
      data: {
        title: String(req.body.title ?? "").trim(),
        description: String(req.body.shortDescription ?? req.body.detailedContent ?? "").slice(0, 1000),
        shortDescription: String(req.body.shortDescription ?? "").slice(0, 180) || null,
        detailedContent: String(req.body.detailedContent ?? "").slice(0, 500) || null,
        linkUrl: String(req.body.learnMoreURL ?? "").slice(0, 255),
        iconId: req.body.iconID ? Number(req.body.iconID) : null,
        publicationStatusId: req.body.pubStatusID ? Number(req.body.pubStatusID) : 1,
        contentCategoryId: req.body.petCareCategoryID ? Number(req.body.petCareCategoryID) : null,
      },
      include: { icon: true, publicationStatus: true, contentCategory: true },
    });
    return success(res, tipDto(tip), "Article updated successfully.");
  } catch (error) {
    return next(error);
  }
};

export const deletePetCareTip = async (req, res, next) => {
  try {
    await prisma.petCareTip.update({ where: { tipId: Number(req.params.tipId) }, data: { isDeleted: true } });
    return success(res, null, "Article deleted successfully.");
  } catch (error) {
    return next(error);
  }
};

export const getVideoCategories = async (req, res, next) => {
  try {
    const categories = await prisma.videoCategory.findMany({ where: { isDeleted: false }, orderBy: { categoryName: "asc" } });
    return success(res, categories.map((category) => ({ id: category.videoCategoryId, name: category.categoryName, videoCategory: category.categoryName })));
  } catch (error) {
    return next(error);
  }
};

export const createVideoCategory = async (req, res, next) => {
  try {
    const name = String(req.body.videoCategory ?? req.body.categoryName ?? "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Category name is required." });
    const category = await prisma.videoCategory.upsert({
      where: { categoryName: name },
      update: { isDeleted: false },
      create: { categoryName: name },
    });
    return success(res, { id: category.videoCategoryId, name: category.categoryName, videoCategory: category.categoryName }, "Category created successfully.", 201);
  } catch (error) {
    return next(error);
  }
};

const videoDto = (video) => ({
  id: video.videoId,
  title: video.title,
  videoTitle: video.title,
  videoURL: video.videoUrl,
  category: video.category.categoryName,
  videoCategoryID: video.categoryId,
  pubStatusID: video.publicationStatusId,
  status: video.publicationStatus.statusName,
  createdAt: video.createdAt,
  updatedAt: video.updatedAt,
});

export const getVideos = async (req, res, next) => {
  try {
    const videos = await prisma.contentVideo.findMany({
      where: { isDeleted: false },
      include: { category: true, publicationStatus: true },
      orderBy: { videoId: "desc" },
    });
    return success(res, videos.map(videoDto));
  } catch (error) {
    return next(error);
  }
};

export const createVideo = async (req, res, next) => {
  try {
    const video = await prisma.contentVideo.create({
      data: {
        title: String(req.body.videoTitle ?? "").trim(),
        videoUrl: String(req.body.videoURL ?? "").trim(),
        categoryId: Number(req.body.videoCategoryID),
        publicationStatusId: Number(req.body.pubStatusID ?? 1),
        uploaderAccountId: req.user.accountId,
      },
      include: { category: true, publicationStatus: true },
    });
    return success(res, videoDto(video), "Video created successfully.", 201);
  } catch (error) {
    return next(error);
  }
};

export const updateVideo = async (req, res, next) => {
  try {
    const video = await prisma.contentVideo.update({
      where: { videoId: Number(req.params.videoId) },
      data: {
        title: String(req.body.videoTitle ?? "").trim(),
        videoUrl: String(req.body.videoURL ?? "").trim(),
        categoryId: Number(req.body.videoCategoryID),
        publicationStatusId: Number(req.body.pubStatusID ?? 1),
      },
      include: { category: true, publicationStatus: true },
    });
    return success(res, videoDto(video), "Video updated successfully.");
  } catch (error) {
    return next(error);
  }
};

export const deleteVideo = async (req, res, next) => {
  try {
    await prisma.contentVideo.update({ where: { videoId: Number(req.params.videoId) }, data: { isDeleted: true } });
    return success(res, null, "Video deleted successfully.");
  } catch (error) {
    return next(error);
  }
};
